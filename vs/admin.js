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
  };

  Common.renderHeader({ containerId: "app-header", activePage: "admin", metaId: "meta-summary" });

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

  function pointAt(index) { return state.monitoring.points[index] || null; }
  function datasetAt(index) { return state.datasets.datasets[index] || null; }
  function layerAt(index) { return state.layerCatalog.layers[index] || null; }

  function renderOverview() {
    overviewText.textContent = Common.getAppContentValue(state.app, "admin", "overview");
    noticeText.textContent = Common.getAppContentValue(state.app, "admin", "notice");
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
      <button type="button" class="${index === state.selectedPoint ? "active" : ""}" data-point-index="${index}">${point.id}</button>
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
    ensureLocaleObject(point.name);
    ensureLocaleObject(point.note);
    pointId.value = point.id || "";
    pointLat.value = point.coords?.[0] ?? "";
    pointLng.value = point.coords?.[1] ?? "";
    pointFields.innerHTML = LOCALES.map((locale) => `
      <div class="locale-card">
        <div class="locale-label">${locale.toUpperCase()}</div>
        <label><span>${I18N.t("admin.localeName")}</span><input type="text" data-locale-field="name" data-locale="${locale}" value="${point.name[locale] || ""}" /></label>
        <label><span>${I18N.t("admin.localeNote")}</span><textarea data-locale-field="note" data-locale="${locale}">${point.note[locale] || ""}</textarea></label>
      </div>
    `).join("");
    pointFields.querySelectorAll("[data-locale-field]").forEach((element) => element.addEventListener("input", () => {
      point[element.dataset.localeField][element.dataset.locale] = element.value;
    }));
  }

  function renderDatasetList() {
    if (!state.datasets.datasets.length) {
      renderEmptyState(datasetList, "admin.noDatasetSelected");
      return;
    }
    datasetList.innerHTML = state.datasets.datasets.map((dataset, index) => `
      <button type="button" class="${index === state.selectedDataset ? "active" : ""}" data-dataset-index="${index}">${dataset.id}</button>
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
    ensureLocaleObject(dataset.title);
    ensureLocaleObject(dataset.summary);
    ensureTagObject(dataset.tags);
    datasetId.value = dataset.id;
    datasetFields.innerHTML = LOCALES.map((locale) => `
      <div class="locale-card">
        <div class="locale-label">${locale.toUpperCase()}</div>
        <label><span>${I18N.t("admin.localeTitle")}</span><input type="text" data-dataset-field="title" data-locale="${locale}" value="${dataset.title[locale] || ""}" /></label>
        <label><span>${I18N.t("admin.localeSummary")}</span><textarea data-dataset-field="summary" data-locale="${locale}">${dataset.summary[locale] || ""}</textarea></label>
        <label><span>${I18N.t("admin.localeTags")}</span><input type="text" data-dataset-field="tags" data-locale="${locale}" value="${(dataset.tags[locale] || []).join(", ")}" /></label>
      </div>
    `).join("");
    datasetFields.querySelectorAll("[data-dataset-field]").forEach((element) => element.addEventListener("input", () => {
      const field = element.dataset.datasetField;
      const locale = element.dataset.locale;
      if (field === "tags") dataset.tags[locale] = element.value.split(",").map((tag) => tag.trim()).filter(Boolean);
      else dataset[field][locale] = element.value;
    }));
  }

  function renderAppEditor() {
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
          ${LOCALES.map((locale) => `
            <div class="locale-card">
              <div class="locale-label">${locale.toUpperCase()}</div>
              <textarea data-app-section="${field.section}" data-app-key="${field.key}" data-locale="${locale}">${values[locale] || ""}</textarea>
            </div>
          `).join("")}
        </div>
      `;
    }).join("");
    appFields.querySelectorAll("textarea[data-app-section]").forEach((element) => element.addEventListener("input", () => {
      state.app[element.dataset.appSection][element.dataset.appKey][element.dataset.locale] = element.value;
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
      return `<button type="button" class="${actualIndex === state.selectedLayer ? "active" : ""}" data-layer-index="${actualIndex}">${layer.id}</button>`;
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
    layerLocalizedFields.innerHTML = LOCALES.map((locale) => `
      <div class="locale-card">
        <div class="locale-label">${locale.toUpperCase()}</div>
        <label><span>${I18N.t("admin.localeTitle")}</span><input type="text" data-layer-field="title" data-locale="${locale}" value="${layer.title[locale] || ""}" /></label>
        <label><span>${I18N.t("admin.localeSummary")}</span><textarea data-layer-field="summary" data-locale="${locale}">${layer.summary[locale] || ""}</textarea></label>
      </div>
    `).join("");
    layerLocalizedFields.querySelectorAll("[data-layer-field]").forEach((element) => element.addEventListener("input", () => {
      layer[element.dataset.layerField][element.dataset.locale] = element.value;
    }));

    layerLegendFields.innerHTML = "";
    if (layer.legend) {
      const legendTitleValues = layer.legend.title || {};
      ensureLocaleObject(legendTitleValues);
      layer.legend.title = legendTitleValues;
      const titleBlock = `
        <div class="locale-grid">
          <div class="panel-title">${I18N.t("admin.layerLegendTitle")}</div>
          ${LOCALES.map((locale) => `
            <div class="locale-card">
              <div class="locale-label">${locale.toUpperCase()}</div>
              <input type="text" data-layer-legend-title="${locale}" value="${layer.legend.title[locale] || ""}" />
            </div>
          `).join("")}
        </div>
      `;
      const itemsBlock = Array.isArray(layer.legend.items) && layer.legend.items.length
        ? `
          <div class="locale-grid">
            <div class="panel-title">${I18N.t("admin.layerLegendItems")}</div>
            ${layer.legend.items.map((item, itemIndex) => {
              ensureLocaleObject(item.label);
              return `
                <div class="locale-card">
                  <div class="locale-label">${item.id}</div>
                  ${LOCALES.map((locale) => `
                    <label>
                      <span>${locale.toUpperCase()}</span>
                      <input type="text" data-layer-legend-item="${itemIndex}" data-locale="${locale}" value="${item.label[locale] || ""}" />
                    </label>
                  `).join("")}
                </div>
              `;
            }).join("")}
          </div>
        `
        : "";
      layerLegendFields.innerHTML = titleBlock + itemsBlock;
      layerLegendFields.querySelectorAll("[data-layer-legend-title]").forEach((element) => element.addEventListener("input", () => {
        layer.legend.title[element.dataset.layerLegendTitle] = element.value;
      }));
      layerLegendFields.querySelectorAll("[data-layer-legend-item]").forEach((element) => element.addEventListener("input", () => {
        layer.legend.items[Number(element.dataset.layerLegendItem)].label[element.dataset.locale] = element.value;
      }));
    }
  }

  async function loadConfigIntoState(name, fallbackKey) {
    const result = await Common.loadConfig(name);
    if (fallbackKey && result.usedFallback) {
      console.warn(`${name} loaded with fallback content.`);
    }
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
    document.getElementById("meta-summary").textContent = I18N.t("admin.localTool");
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
      setStatus(layersStatus, "error", `${I18N.t("messages.saveError")} ${error.message}`);
    }
  });

  I18N.onChange(() => {
    renderOverview();
    renderPointsEditor();
    renderDatasetEditor();
    renderAppEditor();
    renderLayerEditor();
    document.getElementById("meta-summary").textContent = I18N.t("admin.localTool");
  });

  loadAll();
}());
