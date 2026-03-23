(function () {
  const I18N = window.EnvDashI18n;
  const Common = window.EnvDashCommon;
  const LOCALES = Common.LOCALES;

  const state = {
    health: null,
    monitoring: Common.getDefaultConfig("monitoring_points"),
    datasets: Common.getDefaultConfig("dataset_content"),
    app: Common.getDefaultConfig("app_content"),
    layerCatalog: Common.getDefaultConfig("layer_catalog"),
    selectedPoint: 0,
    selectedDataset: 0,
    selectedLayer: 0,
    auth: {
      required: false,
      unlocked: false,
    },
  };

  Common.renderHeader({ containerId: "app-header", activePage: "admin", metaId: "meta-summary" });

  const metaSummary = document.getElementById("meta-summary");
  const adminToolbar = document.getElementById("admin-toolbar");
  const adminEditorLanguageValue = document.getElementById("admin-editor-language-value");
  const adminAuthNote = document.getElementById("admin-auth-note");
  const adminLogoutButton = document.getElementById("admin-logout");
  const authPanel = document.getElementById("admin-auth-panel");
  const authForm = document.getElementById("admin-login-form");
  const authPassword = document.getElementById("admin-password");
  const authStatus = document.getElementById("admin-auth-status");
  const adminContent = document.getElementById("admin-content");
  const healthContainer = document.getElementById("admin-health");
  const overviewText = document.getElementById("admin-overview-text");
  const noticeText = document.getElementById("admin-notice-text");
  const pointsList = document.getElementById("points-list");
  const pointFields = document.getElementById("point-localized-fields");
  const pointId = document.getElementById("point-id");
  const pointLat = document.getElementById("point-lat");
  const pointLng = document.getElementById("point-lng");
  const pointsStatus = document.getElementById("points-status");
  const datasetList = document.getElementById("dataset-list");
  const datasetId = document.getElementById("dataset-id");
  const datasetFields = document.getElementById("dataset-localized-fields");
  const datasetsStatus = document.getElementById("datasets-status");
  const appFields = document.getElementById("app-content-fields");
  const appStatus = document.getElementById("app-status");
  const layerList = document.getElementById("layer-list");
  const layerId = document.getElementById("layer-id");
  const layerKind = document.getElementById("layer-kind");
  const layerLocalizedFields = document.getElementById("layer-localized-fields");
  const layerLegendFields = document.getElementById("layer-legend-fields");
  const layerDefaultVisible = document.getElementById("layer-default-visible");
  const layerShowLegend = document.getElementById("layer-show-legend");
  const layerShowActive = document.getElementById("layer-show-active");
  const layerSortOrder = document.getElementById("layer-sort-order");
  const layersStatus = document.getElementById("layers-status");

  function setStatus(element, type, message) {
    element.className = `status-message${type ? ` ${type}` : ""}`;
    element.textContent = message || "";
  }

  function renderEmptyState(container, key) {
    container.innerHTML = `<div class="empty-state">${I18N.t(key)}</div>`;
  }

  function ensureLocaleObject(target) {
    LOCALES.forEach((locale) => {
      if (typeof target[locale] !== "string") target[locale] = "";
    });
  }

  function ensureTagObject(target) {
    LOCALES.forEach((locale) => {
      if (!Array.isArray(target[locale])) target[locale] = [];
    });
  }

  function getActiveLocale() {
    return I18N.getLanguage();
  }

  function getActiveLocaleLabel() {
    return I18N.getLanguageName(getActiveLocale());
  }

  function pointAt(index) { return state.monitoring.points[index] || null; }
  function datasetAt(index) { return state.datasets.datasets[index] || null; }
  function layerAt(index) { return state.layerCatalog.layers[index] || null; }

  function updateToolbar() {
    adminEditorLanguageValue.textContent = getActiveLocaleLabel();
    adminAuthNote.textContent = I18N.t(state.auth.required ? "admin.authEnabledNotice" : "admin.authDisabledNotice");
    adminLogoutButton.classList.toggle("hidden", !state.auth.required);
  }

  function updateAccessUi() {
    const unlocked = !state.auth.required || state.auth.unlocked;
    adminToolbar.classList.toggle("hidden", !unlocked);
    adminContent.classList.toggle("hidden", !unlocked);
    authPanel.classList.toggle("hidden", unlocked);
    updateToolbar();
  }

  function handleAuthFailure() {
    Common.logoutAdmin();
    state.auth.unlocked = false;
    updateAccessUi();
    setStatus(authStatus, "error", I18N.t("admin.loginRequired"));
  }

  function renderOverview() {
    overviewText.textContent = Common.getAppContentValue(state.app, "admin", "overview");
    const notice = Common.getAppContentValue(state.app, "admin", "notice");
    noticeText.textContent = state.auth.required
      ? `${notice} ${I18N.t("admin.authEnabledNotice")}`.trim()
      : notice;
    if (!state.health) {
      healthContainer.innerHTML = `<div class="empty-state">${I18N.t("messages.loadingFailed")}</div>`;
      return;
    }
    const items = [
      { label: I18N.t("admin.healthLabel"), value: state.health.status },
      { label: I18N.t("admin.configDir"), value: state.health.config_dir },
      { label: I18N.t("admin.backupDir"), value: state.health.backup_dir },
      { label: I18N.t("admin.availableConfigs"), value: state.health.available_configs.join(", ") },
    ];
    healthContainer.innerHTML = items.map((item) => `
      <div class="status-card">
        <div class="status-label">${item.label}</div>
        <div class="status-value">${item.value}</div>
      </div>
    `).join("");
  }

  function renderPointsList() {
    if (!state.monitoring.points.length) {
      renderEmptyState(pointsList, "admin.noPointSelected");
      return;
    }
    pointsList.innerHTML = state.monitoring.points.map((point, index) => `
      <button type="button" class="${index === state.selectedPoint ? "active" : ""}" data-point-index="${index}">
        <span class="admin-list-action">${I18N.t("admin.selectPoint")}</span>
        <strong class="admin-list-id">${point.id}</strong>
      </button>
    `).join("");
    pointsList.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
      state.selectedPoint = Number(button.dataset.pointIndex);
      renderPointsEditor();
    }));
  }

  function renderPointsEditor() {
    renderPointsList();
    const point = pointAt(state.selectedPoint);
    if (!point) {
      pointId.value = "";
      pointLat.value = "";
      pointLng.value = "";
      renderEmptyState(pointFields, "admin.noPointSelected");
      return;
    }
    const locale = getActiveLocale();
    ensureLocaleObject(point.name);
    ensureLocaleObject(point.note);
    pointId.value = point.id || "";
    pointLat.value = point.coords?.[0] ?? "";
    pointLng.value = point.coords?.[1] ?? "";
    pointFields.innerHTML = `
      <div class="locale-card single-locale-card">
        <div class="locale-label">${getActiveLocaleLabel()}</div>
        <label><span>${I18N.t("admin.localeName")}</span><input type="text" data-locale-field="name" value="${point.name[locale] || ""}" /></label>
        <label><span>${I18N.t("admin.localeNote")}</span><textarea data-locale-field="note">${point.note[locale] || ""}</textarea></label>
      </div>
    `;
    pointFields.querySelectorAll("[data-locale-field]").forEach((element) => element.addEventListener("input", () => {
      point[element.dataset.localeField][locale] = element.value;
    }));
  }

  function renderDatasetList() {
    if (!state.datasets.datasets.length) {
      renderEmptyState(datasetList, "admin.noDatasetSelected");
      return;
    }
    datasetList.innerHTML = state.datasets.datasets.map((dataset, index) => `
      <button type="button" class="${index === state.selectedDataset ? "active" : ""}" data-dataset-index="${index}">
        <span class="admin-list-action">${I18N.t("admin.selectDataset")}</span>
        <strong class="admin-list-id">${dataset.id}</strong>
      </button>
    `).join("");
    datasetList.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
      state.selectedDataset = Number(button.dataset.datasetIndex);
      renderDatasetEditor();
    }));
  }

  function renderDatasetEditor() {
    renderDatasetList();
    const dataset = datasetAt(state.selectedDataset);
    if (!dataset) {
      datasetId.value = "";
      renderEmptyState(datasetFields, "admin.noDatasetSelected");
      return;
    }
    const locale = getActiveLocale();
    ensureLocaleObject(dataset.title);
    ensureLocaleObject(dataset.summary);
    ensureTagObject(dataset.tags);
    datasetId.value = dataset.id;
    datasetFields.innerHTML = `
      <div class="locale-card single-locale-card">
        <div class="locale-label">${getActiveLocaleLabel()}</div>
        <label><span>${I18N.t("admin.localeTitle")}</span><input type="text" data-dataset-field="title" value="${dataset.title[locale] || ""}" /></label>
        <label><span>${I18N.t("admin.localeSummary")}</span><textarea data-dataset-field="summary">${dataset.summary[locale] || ""}</textarea></label>
        <label><span>${I18N.t("admin.localeTags")}</span><input type="text" data-dataset-field="tags" value="${(dataset.tags[locale] || []).join(", ")}" /></label>
      </div>
    `;
    datasetFields.querySelectorAll("[data-dataset-field]").forEach((element) => element.addEventListener("input", () => {
      const field = element.dataset.datasetField;
      if (field === "tags") dataset.tags[locale] = element.value.split(",").map((tag) => tag.trim()).filter(Boolean);
      else dataset[field][locale] = element.value;
    }));
  }

  function renderAppEditor() {
    const locale = getActiveLocale();
    const fieldDefs = [
      { section: "dashboard", key: "intro", label: I18N.t("admin.dashboardIntro") },
      { section: "dashboard", key: "summary", label: I18N.t("admin.dashboardSummary") },
      { section: "datasets", key: "intro", label: I18N.t("admin.datasetsIntro") },
      { section: "admin", key: "overview", label: I18N.t("admin.adminOverview") },
      { section: "admin", key: "notice", label: I18N.t("admin.adminNotice") },
    ];
    appFields.innerHTML = fieldDefs.map((field) => {
      const values = state.app[field.section][field.key];
      ensureLocaleObject(values);
      return `
        <div class="locale-grid">
          <div class="panel-title">${field.label}</div>
          <div class="locale-card single-locale-card">
            <div class="locale-label">${getActiveLocaleLabel()}</div>
            <textarea data-app-section="${field.section}" data-app-key="${field.key}">${values[locale] || ""}</textarea>
          </div>
        </div>
      `;
    }).join("");
    appFields.querySelectorAll("textarea[data-app-section]").forEach((element) => element.addEventListener("input", () => {
      state.app[element.dataset.appSection][element.dataset.appKey][locale] = element.value;
      renderOverview();
    }));
  }

  function renderLayerList() {
    if (!state.layerCatalog.layers.length) {
      renderEmptyState(layerList, "admin.noLayerSelected");
      return;
    }
    const sorted = Common.sortLayersByCatalog(state.layerCatalog.layers, state.layerCatalog);
    layerList.innerHTML = sorted.map((layer) => {
      const actualIndex = state.layerCatalog.layers.findIndex((entry) => entry.id === layer.id);
      return `
        <button type="button" class="${actualIndex === state.selectedLayer ? "active" : ""}" data-layer-index="${actualIndex}">
          <span class="admin-list-action">${I18N.t("admin.selectLayer")}</span>
          <strong class="admin-list-id">${layer.id}</strong>
        </button>
      `;
    }).join("");
    layerList.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
      state.selectedLayer = Number(button.dataset.layerIndex);
      renderLayerEditor();
    }));
  }

  function renderLayerEditor() {
    renderLayerList();
    const layer = layerAt(state.selectedLayer);
    if (!layer) {
      layerId.value = "";
      layerKind.value = "";
      layerDefaultVisible.checked = false;
      layerShowLegend.checked = false;
      layerShowActive.checked = false;
      layerSortOrder.value = "";
      renderEmptyState(layerLocalizedFields, "admin.noLayerSelected");
      layerLegendFields.innerHTML = "";
      return;
    }
    const locale = getActiveLocale();
    ensureLocaleObject(layer.title);
    ensureLocaleObject(layer.summary);
    if (layer.legend?.title) ensureLocaleObject(layer.legend.title);
    if (Array.isArray(layer.legend?.items)) {
      layer.legend.items.forEach((item) => ensureLocaleObject(item.label));
    }
    layerId.value = layer.id;
    layerKind.value = layer.kind;
    layerDefaultVisible.checked = layer.defaultVisible !== false;
    layerShowLegend.checked = layer.showInLegend !== false;
    layerShowActive.checked = layer.showInActiveLayers !== false;
    layerSortOrder.value = Number.isFinite(layer.sortOrder) ? layer.sortOrder : 0;
    layerLocalizedFields.innerHTML = `
      <div class="locale-card single-locale-card">
        <div class="locale-label">${getActiveLocaleLabel()}</div>
        <label><span>${I18N.t("admin.localeTitle")}</span><input type="text" data-layer-field="title" value="${layer.title[locale] || ""}" /></label>
        <label><span>${I18N.t("admin.localeSummary")}</span><textarea data-layer-field="summary">${layer.summary[locale] || ""}</textarea></label>
      </div>
    `;
    layerLocalizedFields.querySelectorAll("[data-layer-field]").forEach((element) => element.addEventListener("input", () => {
      layer[element.dataset.layerField][locale] = element.value;
    }));

    layerLegendFields.innerHTML = "";
    if (layer.legend) {
      const legendTitleValues = layer.legend.title || {};
      ensureLocaleObject(legendTitleValues);
      layer.legend.title = legendTitleValues;
      const titleBlock = `
        <div class="locale-grid">
          <div class="panel-title">${I18N.t("admin.layerLegendTitle")}</div>
          <div class="locale-card single-locale-card">
            <div class="locale-label">${getActiveLocaleLabel()}</div>
            <input type="text" data-layer-legend-title value="${layer.legend.title[locale] || ""}" />
          </div>
        </div>
      `;
      const itemsBlock = Array.isArray(layer.legend.items) && layer.legend.items.length
        ? `
          <div class="locale-grid">
            <div class="panel-title">${I18N.t("admin.layerLegendItems")}</div>
            ${layer.legend.items.map((item, itemIndex) => `
              <div class="locale-card single-locale-card">
                <div class="locale-label">${item.id}</div>
                <label>
                  <span>${getActiveLocaleLabel()}</span>
                  <input type="text" data-layer-legend-item="${itemIndex}" value="${item.label[locale] || ""}" />
                </label>
              </div>
            `).join("")}
          </div>
        `
        : "";
      layerLegendFields.innerHTML = titleBlock + itemsBlock;
      layerLegendFields.querySelectorAll("[data-layer-legend-title]").forEach((element) => element.addEventListener("input", () => {
        layer.legend.title[locale] = element.value;
      }));
      layerLegendFields.querySelectorAll("[data-layer-legend-item]").forEach((element) => element.addEventListener("input", () => {
        layer.legend.items[Number(element.dataset.layerLegendItem)].label[locale] = element.value;
      }));
    }
  }

  async function loadConfigIntoState(name) {
    const result = await Common.loadConfig(name);
    return result.data;
  }

  async function loadAll() {
    const [healthResult, monitoringResult, datasetResult, appResult, layerResult] = await Promise.allSettled([
      Common.fetchAdminHealth(),
      loadConfigIntoState("monitoring_points"),
      loadConfigIntoState("dataset_content"),
      loadConfigIntoState("app_content"),
      loadConfigIntoState("layer_catalog"),
    ]);
    const authFailure = [healthResult, monitoringResult, datasetResult, appResult, layerResult]
      .find((result) => result.status === "rejected" && result.reason && result.reason.status === 401);
    if (authFailure) {
      handleAuthFailure();
      return;
    }
    state.health = healthResult.status === "fulfilled" ? healthResult.value : null;
    state.monitoring = monitoringResult.status === "fulfilled" ? monitoringResult.value : Common.getDefaultConfig("monitoring_points");
    state.datasets = datasetResult.status === "fulfilled" ? datasetResult.value : Common.getDefaultConfig("dataset_content");
    state.app = appResult.status === "fulfilled" ? appResult.value : Common.getDefaultConfig("app_content");
    state.layerCatalog = layerResult.status === "fulfilled" ? layerResult.value : Common.getDefaultConfig("layer_catalog");
    state.selectedPoint = Math.min(state.selectedPoint, Math.max(0, state.monitoring.points.length - 1));
    state.selectedDataset = Math.min(state.selectedDataset, Math.max(0, state.datasets.datasets.length - 1));
    state.selectedLayer = Math.min(state.selectedLayer, Math.max(0, state.layerCatalog.layers.length - 1));
    renderOverview();
    renderPointsEditor();
    renderDatasetEditor();
    renderAppEditor();
    renderLayerEditor();
    metaSummary.textContent = I18N.t("admin.localTool");
  }

  async function reloadConfig(name, assign, render, statusElement) {
    try {
      setStatus(statusElement, "", "");
      const result = await Common.loadConfig(name);
      assign(result.data);
      render();
      if (result.usedFallback) {
        setStatus(statusElement, "error", I18N.t("messages.usingFallbackContent"));
      }
    } catch (error) {
      if (error && error.status === 401) {
        handleAuthFailure();
        return;
      }
      setStatus(statusElement, "error", `${I18N.t("messages.loadingFailed")} ${error.message}`);
    }
  }

  pointId.addEventListener("input", () => {
    const point = pointAt(state.selectedPoint);
    if (!point) return;
    point.id = pointId.value;
    renderPointsList();
  });
  pointLat.addEventListener("input", () => {
    const point = pointAt(state.selectedPoint);
    if (point) point.coords[0] = Number(pointLat.value);
  });
  pointLng.addEventListener("input", () => {
    const point = pointAt(state.selectedPoint);
    if (point) point.coords[1] = Number(pointLng.value);
  });
  layerDefaultVisible.addEventListener("change", () => { const layer = layerAt(state.selectedLayer); if (layer) layer.defaultVisible = layerDefaultVisible.checked; });
  layerShowLegend.addEventListener("change", () => { const layer = layerAt(state.selectedLayer); if (layer) layer.showInLegend = layerShowLegend.checked; });
  layerShowActive.addEventListener("change", () => { const layer = layerAt(state.selectedLayer); if (layer) layer.showInActiveLayers = layerShowActive.checked; });
  layerSortOrder.addEventListener("input", () => { const layer = layerAt(state.selectedLayer); if (layer) layer.sortOrder = Number(layerSortOrder.value); });

  document.getElementById("point-add").addEventListener("click", () => {
    state.monitoring.points.push({ id: `point-${state.monitoring.points.length + 1}`, coords: [46.28, 20.14], name: { en: "", zh: "", hu: "", ku: "" }, note: { en: "", zh: "", hu: "", ku: "" } });
    state.selectedPoint = state.monitoring.points.length - 1;
    renderPointsEditor();
  });
  document.getElementById("point-delete").addEventListener("click", () => {
    if (!state.monitoring.points.length) return;
    state.monitoring.points.splice(state.selectedPoint, 1);
    if (!state.monitoring.points.length) state.monitoring.points.push({ id: "point-1", coords: [46.28, 20.14], name: { en: "", zh: "", hu: "", ku: "" }, note: { en: "", zh: "", hu: "", ku: "" } });
    state.selectedPoint = Math.max(0, state.selectedPoint - 1);
    renderPointsEditor();
  });

  document.getElementById("points-reload").addEventListener("click", async () => {
    await reloadConfig("monitoring_points", (data) => {
      state.monitoring = data;
      state.selectedPoint = 0;
    }, renderPointsEditor, pointsStatus);
  });
  document.getElementById("datasets-reload").addEventListener("click", async () => {
    await reloadConfig("dataset_content", (data) => {
      state.datasets = data;
      state.selectedDataset = 0;
    }, renderDatasetEditor, datasetsStatus);
  });
  document.getElementById("app-reload").addEventListener("click", async () => {
    await reloadConfig("app_content", (data) => {
      state.app = data;
    }, () => {
      renderOverview();
      renderAppEditor();
    }, appStatus);
  });
  document.getElementById("layers-reload").addEventListener("click", async () => {
    await reloadConfig("layer_catalog", (data) => {
      state.layerCatalog = data;
      state.selectedLayer = 0;
    }, renderLayerEditor, layersStatus);
  });

  document.getElementById("points-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      setStatus(pointsStatus, "", I18N.t("messages.saving"));
      await Common.saveConfig("monitoring_points", state.monitoring);
      setStatus(pointsStatus, "success", I18N.t("messages.saveSuccess"));
    } catch (error) {
      if (error && error.status === 401) {
        handleAuthFailure();
        setStatus(pointsStatus, "error", I18N.t("admin.loginRequired"));
        return;
      }
      setStatus(pointsStatus, "error", `${I18N.t("messages.saveError")} ${error.message}`);
    }
  });
  document.getElementById("dataset-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      setStatus(datasetsStatus, "", I18N.t("messages.saving"));
      await Common.saveConfig("dataset_content", state.datasets);
      setStatus(datasetsStatus, "success", I18N.t("messages.saveSuccess"));
    } catch (error) {
      if (error && error.status === 401) {
        handleAuthFailure();
        setStatus(datasetsStatus, "error", I18N.t("admin.loginRequired"));
        return;
      }
      setStatus(datasetsStatus, "error", `${I18N.t("messages.saveError")} ${error.message}`);
    }
  });
  document.getElementById("app-content-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      setStatus(appStatus, "", I18N.t("messages.saving"));
      await Common.saveConfig("app_content", state.app);
      setStatus(appStatus, "success", I18N.t("messages.saveSuccess"));
      renderOverview();
    } catch (error) {
      if (error && error.status === 401) {
        handleAuthFailure();
        setStatus(appStatus, "error", I18N.t("admin.loginRequired"));
        return;
      }
      setStatus(appStatus, "error", `${I18N.t("messages.saveError")} ${error.message}`);
    }
  });
  document.getElementById("layer-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      setStatus(layersStatus, "", I18N.t("messages.saving"));
      await Common.saveConfig("layer_catalog", state.layerCatalog);
      setStatus(layersStatus, "success", I18N.t("messages.saveSuccess"));
      renderLayerList();
    } catch (error) {
      if (error && error.status === 401) {
        handleAuthFailure();
        setStatus(layersStatus, "error", I18N.t("admin.loginRequired"));
        return;
      }
      setStatus(layersStatus, "error", `${I18N.t("messages.saveError")} ${error.message}`);
    }
  });

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      setStatus(authStatus, "", I18N.t("messages.saving"));
      await Common.loginAdmin(authPassword.value);
      state.auth.unlocked = true;
      updateAccessUi();
      setStatus(authStatus, "success", I18N.t("admin.loginSuccess"));
      await loadAll();
    } catch (error) {
      setStatus(authStatus, "error", error.message || I18N.t("admin.loginRequired"));
    }
  });

  adminLogoutButton.addEventListener("click", () => {
    Common.logoutAdmin();
    state.auth.unlocked = false;
    updateAccessUi();
    setStatus(authStatus, "", "");
  });

  I18N.onChange(() => {
    updateToolbar();
    renderOverview();
    renderPointsEditor();
    renderDatasetEditor();
    renderAppEditor();
    renderLayerEditor();
    metaSummary.textContent = I18N.t("admin.localTool");
  });

  async function init() {
    updateToolbar();
    try {
      const authConfig = await Common.fetchAdminAuthStatus();
      state.auth.required = Boolean(authConfig.auth_required);
      state.auth.unlocked = !state.auth.required || Common.hasAdminPassword();
    } catch (error) {
      state.auth.required = false;
      state.auth.unlocked = true;
    }
    updateAccessUi();
    if (!state.auth.required || state.auth.unlocked) {
      await loadAll();
    }
  }

  init();
}());
