(function () {
  const I18N = window.EnvDashI18n;
  const Common = window.EnvDashCommon;

  const content = document.getElementById("datasets-content");
  const intro = document.getElementById("datasets-intro");
  const warning = document.getElementById("datasets-warning");
  const feedback = document.getElementById("datasets-feedback");
  let cachedCatalog = [];
  let appContent = Common.getDefaultConfig("app_content");
  let datasetContent = Common.getDefaultConfig("dataset_content");
  let usedFallback = false;

  Common.renderHeader({ containerId: "app-header", activePage: "datasets", metaId: "meta-summary" });

  function renderWarning() {
    warning.textContent = I18N.t("messages.usingFallbackContent");
    warning.classList.toggle("hidden", !usedFallback);
  }

  function renderLoadingState(key) {
    content.innerHTML = `<div class="empty-state">${I18N.t(key)}</div>`;
  }

  function applyPageContent() {
    intro.textContent = Common.getAppContentValue(appContent, "datasets", "intro");
    feedback.textContent = I18N.t("datasets.note");
    renderWarning();
  }

  function renderCatalog() {
    if (!cachedCatalog.length) {
      renderLoadingState("datasets.empty");
      return;
    }

    content.innerHTML = cachedCatalog.map((entry) => `
      <article class="dataset-card">
        <h3>${entry.title}</h3>
        <p>${entry.summary}</p>
        <div class="tag-list">${entry.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
        <dl class="meta-list">
          <div class="meta-row">
            <dt>${I18N.t("datasets.fieldType")}</dt>
            <dd>${I18N.t(entry.typeKey)}</dd>
          </div>
          <div class="meta-row">
            <dt>${I18N.t("datasets.fieldSource")}</dt>
            <dd>${entry.sourceFile || "-"}</dd>
          </div>
          <div class="meta-row">
            <dt>${I18N.t("datasets.fieldOrigin")}</dt>
            <dd>${entry.metadataSource || "-"}</dd>
          </div>
        </dl>
      </article>
    `).join("");

    document.getElementById("meta-summary").textContent = `${cachedCatalog.length} ${I18N.t("datasets.kicker").toLowerCase()}`;
  }

  async function init() {
    renderLoadingState("datasets.loading");
    document.getElementById("meta-summary").textContent = I18N.t("datasets.loading");

    const [datasetResult, appResult] = await Promise.all([
      Common.loadConfig("dataset_content"),
      Common.loadConfig("app_content"),
    ]);
    datasetContent = datasetResult.data;
    appContent = appResult.data;
    usedFallback = datasetResult.usedFallback || appResult.usedFallback;
    applyPageContent();

    try {
      cachedCatalog = await Common.loadDatasetCatalog(datasetContent);
      renderCatalog();
    } catch (error) {
      console.warn("Dataset catalog load failed:", error);
      content.innerHTML = `<div class="empty-state">${I18N.t("datasets.error")}</div>`;
      document.getElementById("meta-summary").textContent = I18N.t("datasets.error");
    }
  }

  I18N.onChange(async () => {
    applyPageContent();
    cachedCatalog = await Common.loadDatasetCatalog(datasetContent);
    renderCatalog();
  });

  init();
}());

