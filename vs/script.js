(function () {
  const I18N = window.EnvDashI18n;
  const Common = window.EnvDashCommon;

  const DEFAULT_CENTER = [46.2854, 20.1388];
  const DEFAULT_ZOOM = 11;

  const summaryContainer = document.getElementById("dashboard-summary");
  const legendContent = document.getElementById("legend-content");
  const activeLayerList = document.getElementById("active-layer-list");
  const dashboardIntro = document.getElementById("dashboard-intro");
  const dashboardSummaryNote = document.getElementById("dashboard-summary-note");
  const dashboardWarning = document.getElementById("dashboard-warning");
  const layerCatalogList = document.getElementById("layer-catalog-list");

  const metaSummary = Common.renderHeader({ containerId: "app-header", activePage: "dashboard", metaId: "meta-summary" });

  const map = L.map("map", { zoomControl: false, attributionControl: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  L.control.zoom({ position: "bottomright" }).addTo(map);

  const baseLayerEntries = Common.getBaseLayerConfigs().map((config) => ({ ...config, layer: L.tileLayer(config.url, config.options) }));
  baseLayerEntries[0].layer.addTo(map);

  const overlayEntries = [];
  const contentState = {
    datasetContent: Common.getDefaultConfig("dataset_content"),
    appContent: Common.getDefaultConfig("app_content"),
    monitoringPoints: Common.getDefaultConfig("monitoring_points"),
    layerCatalog: Common.getDefaultConfig("layer_catalog"),
    usedFallback: false,
  };

  let layerControl = null;
  let rasterIndexBounds = {};
  let loadedMetadataCount = 0;
  let totalRasterCount = 0;
  let monitoringLayer = null;
  const loadedScripts = new Set();

  function showFallbackWarning() {
    dashboardWarning.textContent = I18N.t("messages.usingFallbackContent");
    dashboardWarning.classList.toggle("hidden", !contentState.usedFallback);
  }

  function getLayerDisplay(layerId, fallbackTitle) {
    return Common.getLayerDisplay(layerId, contentState.layerCatalog, fallbackTitle);
  }

  function applyPageContent() {
    dashboardIntro.textContent = Common.getAppContentValue(contentState.appContent, "dashboard", "intro");
    dashboardSummaryNote.textContent = Common.getAppContentValue(contentState.appContent, "dashboard", "summary");
    showFallbackWarning();
    renderLayerCatalogList();
  }

  function renderLayerCatalogList() {
    const entries = Common.sortLayersByCatalog(contentState.layerCatalog.layers || [], contentState.layerCatalog)
      .filter((entry) => {
        if (!entry || typeof entry !== "object" || !entry.id) {
          console.warn("Skipping invalid layer catalog entry:", entry);
          return false;
        }
        return entry.kind !== "base";
      });
    layerCatalogList.innerHTML = entries.map((entry) => {
      const display = getLayerDisplay(entry.id, contentState.layerCatalog, entry.id);
      return `
        <div class="layer-catalog-item">
          <h4>${display.title || entry.id}</h4>
          <p>${display.summary || I18N.t("messages.noLayerSummary")}</p>
        </div>
      `;
    }).join("");
  }

  function loadScript(src) {
    if (loadedScripts.has(src)) return Promise.resolve();
    loadedScripts.add(src);
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  function resolveParseGeoraster() {
    if (typeof window.parseGeoraster === "function") return window.parseGeoraster;
    if (window.georaster && typeof window.georaster.parseGeoraster === "function") return window.georaster.parseGeoraster;
    return null;
  }

  function resolveGeoRasterLayer() {
    if (typeof window.GeoRasterLayer === "function") return window.GeoRasterLayer;
    if (window.georasterLayer && typeof window.georasterLayer.GeoRasterLayer === "function") return window.georasterLayer.GeoRasterLayer;
    return null;
  }

  async function ensureRasterLibs() {
    if (resolveParseGeoraster() && resolveGeoRasterLayer()) return true;
    for (const src of [
      "https://cdn.jsdelivr.net/npm/geotiff@2.1.3/dist/geotiff.browser.min.js",
      "https://unpkg.com/geotiff@2.1.3/dist/geotiff.browser.min.js",
      "https://cdn.jsdelivr.net/npm/georaster@1.6.0/dist/georaster.browser.min.js",
      "https://unpkg.com/georaster@1.6.0/dist/georaster.browser.min.js",
      "https://cdn.jsdelivr.net/npm/georaster-layer-for-leaflet@3.10.0/dist/georaster-layer-for-leaflet.min.js",
      "https://unpkg.com/georaster-layer-for-leaflet@3.10.0/dist/georaster-layer-for-leaflet.min.js",
    ]) {
      if (resolveParseGeoraster() && resolveGeoRasterLayer()) break;
      try {
        await loadScript(src);
      } catch (error) {
        // Try next CDN.
      }
    }
    return Boolean(resolveParseGeoraster() && resolveGeoRasterLayer());
  }

  function rebuildLayerControl() {
    if (layerControl) map.removeControl(layerControl);
    const baseLayers = {};
    baseLayerEntries.forEach((entry) => {
      baseLayers[I18N.t(entry.labelKey)] = entry.layer;
    });
    const overlayLayers = {};
    Common.sortLayersByCatalog(overlayEntries, contentState.layerCatalog).forEach((entry) => {
      overlayLayers[getLayerDisplay(entry.datasetId, contentState.layerCatalog, entry.fallbackTitle).title] = entry.layer;
    });
    layerControl = L.control.layers(baseLayers, overlayLayers, { position: "topright", collapsed: false }).addTo(map);
  }

  function renderDashboardSummary() {
    const visibleOverlayCount = overlayEntries.filter(({ layer, datasetId }) => {
      const display = getLayerDisplay(datasetId, contentState.layerCatalog);
      return map.hasLayer(layer) && display.showInActiveLayers !== false;
    }).length;
    const items = [
      { label: I18N.t("dashboard.summaryDatasets"), value: `${loadedMetadataCount}/${totalRasterCount}` },
      { label: I18N.t("dashboard.summaryLayers"), value: String(visibleOverlayCount) },
      { label: I18N.t("dashboard.summaryLanguage"), value: Common.getLanguageLabel(I18N.getLanguage()) },
    ];
    summaryContainer.innerHTML = items.map((item) => `
      <div class="status-card">
        <div class="status-label">${item.label}</div>
        <div class="status-value">${item.value}</div>
      </div>
    `).join("");
  }

  function renderOverlaySummaries() {
    const active = Common.sortLayersByCatalog(overlayEntries.filter(({ layer }) => map.hasLayer(layer)), contentState.layerCatalog)
      .filter(({ datasetId }) => getLayerDisplay(datasetId, contentState.layerCatalog).showInActiveLayers !== false);
    if (!active.length) {
      activeLayerList.textContent = I18N.t("messages.noActiveOverlays");
    } else {
      activeLayerList.innerHTML = active.map(({ datasetId, fallbackTitle }) => {
        const display = getLayerDisplay(datasetId, contentState.layerCatalog, fallbackTitle);
        return `<div>${display.title || fallbackTitle || datasetId}</div>`;
      }).join("");
    }
    renderDashboardSummary();
  }

  function renderLegends() {
    const active = Common.sortLayersByCatalog(
      overlayEntries.filter(({ layer, datasetId, getLegend }) => map.hasLayer(layer) && getLegend && getLayerDisplay(datasetId, contentState.layerCatalog).showInLegend !== false),
      contentState.layerCatalog,
    );
    if (!active.length) {
      legendContent.textContent = I18N.t("messages.activateLayerLegend");
      return;
    }
    legendContent.innerHTML = active.map(({ getLegend }) => {
      const legend = getLegend();
      if (!legend || !legend.items || !legend.items.length) return "";
      const items = legend.items.map((item) => `
        <div class="legend-item">
          <span class="legend-swatch" style="background:${item.color || "#66e3c4"}"></span>
          <span>${item.label || I18N.t("messages.noLayerSummary")}</span>
        </div>
      `).join("");
      return `<div class="legend-block"><div class="legend-title">${legend.title || I18N.t("dashboard.legendTitle")}</div>${items}</div>`;
    }).join("");
  }

  function registerOverlay(layer, datasetId, getLegend, fallbackTitle) {
    overlayEntries.push({ layer, datasetId, getLegend, fallbackTitle });
    rebuildLayerControl();
    renderOverlaySummaries();
    renderLegends();
  }

  function refreshMonitoringLayer() {
    if (!monitoringLayer) return;
    monitoringLayer.clearLayers();
    const layerTitle = getLayerDisplay("monitoring-points", "Monitoring Points").title;
    Common.getMonitoringPointsConfig(contentState.monitoringPoints).forEach((point) => {
      const name = point.name?.[I18N.getLanguage()] || point.name?.en || point.id;
      const note = point.note?.[I18N.getLanguage()] || point.note?.en || "";
      const marker = L.circleMarker(point.coords, {
        radius: 6,
        color: "#66e3c4",
        fillColor: "#66e3c4",
        fillOpacity: 0.8,
        weight: 2,
      }).bindPopup(`<strong>${layerTitle}: ${name}</strong><br />${note}`);
      monitoringLayer.addLayer(marker);
    });
  }

  function colorRamp(value, min, max, stops) {
    if (value === null || Number.isNaN(value)) return null;
    if (max === min) return `rgb(${stops[stops.length - 1].color.join(",")})`;
    const t = Math.min(Math.max((value - min) / (max - min), 0), 1);
    for (let index = 0; index < stops.length - 1; index += 1) {
      const left = stops[index];
      const right = stops[index + 1];
      if (t >= left.stop && t <= right.stop) {
        const span = (t - left.stop) / (right.stop - left.stop);
        return `rgb(${Math.round(left.color[0] + (right.color[0] - left.color[0]) * span)}, ${Math.round(left.color[1] + (right.color[1] - left.color[1]) * span)}, ${Math.round(left.color[2] + (right.color[2] - left.color[2]) * span)})`;
      }
    }
    return `rgb(${stops[stops.length - 1].color.join(",")})`;
  }

  async function loadRasterIndex() {
    try {
      const response = await Common.fetchWithBases("raster/index.json");
      const data = await response.json();
      rasterIndexBounds = data.reduce((accumulator, item) => {
        if (!item.name || !item.bounds || item.bounds.length !== 4) return accumulator;
        const [bottom, left, top, right] = item.bounds;
        accumulator[item.name] = [[bottom, left], [top, right]];
        return accumulator;
      }, {});
    } catch (error) {
      rasterIndexBounds = {};
    }
  }

  async function loadRasterLayer(config) {
    if (!config.tifPath) return null;
    try {
      const libsReady = await ensureRasterLibs();
      const layerDisplay = getLayerDisplay(config.id, config.id);
      if (!libsReady) {
        if (config.bounds) {
          const fileName = config.tifPath.split("/").pop();
          const rasterUrl = await Common.resolveUrl(`TIF/${fileName}?render=1`);
          const rasterOverlay = L.imageOverlay(rasterUrl, config.bounds, { opacity: 0.75, crossOrigin: true });
          if (layerDisplay.defaultVisible !== false) rasterOverlay.addTo(map);
          registerOverlay(rasterOverlay, config.id, () => Common.buildLegend(config, contentState.layerCatalog), config.id);
          return rasterOverlay;
        }
        return null;
      }
      const parseGeoraster = resolveParseGeoraster();
      const GeoRasterLayer = resolveGeoRasterLayer();
      const response = await Common.fetchWithBases(config.tifPath);
      const arrayBuffer = await response.arrayBuffer();
      const georaster = await parseGeoraster(arrayBuffer);
      const min = config.min ?? georaster.mins?.[0];
      const max = config.max ?? georaster.maxs?.[0];
      let pixelValuesToColorFn = config.pixelValuesToColorFn;
      if (config.type === "continuous") {
        pixelValuesToColorFn = (values) => colorRamp(values[0], min ?? 0, max ?? 1, config.colorStops);
      }
      if (config.type === "multiband") {
        const maxValue = max ?? 15000;
        pixelValuesToColorFn = (values) => {
          if (!values || values.length < 3) return null;
          const [r, g, b] = values;
          if ([r, g, b].some((value) => value === null || Number.isNaN(value))) return null;
          const scale = (value) => Math.min(Math.max(value / maxValue, 0), 1);
          return `rgb(${Math.round(scale(r) * 255)}, ${Math.round(scale(g) * 255)}, ${Math.round(scale(b) * 255)})`;
        };
      }
      const rasterLayer = new GeoRasterLayer({ georaster, opacity: 0.75, resolution: 128, pixelValuesToColorFn });
      if (layerDisplay.defaultVisible !== false) rasterLayer.addTo(map);
      registerOverlay(rasterLayer, config.id, () => Common.buildLegend(config, contentState.layerCatalog), config.id);
      if (!map._loadedBounds && georaster.bbox) {
        const [xmin, ymin, xmax, ymax] = georaster.bbox;
        map.fitBounds([[ymin, xmin], [ymax, xmax]]);
        map._loadedBounds = true;
      }
      return rasterLayer;
    } catch (error) {
      console.warn(`Unable to load raster ${config.id}:`, error);
      return null;
    }
  }

  async function loadShapefile() {
    try {
      const shpUrl = (await Common.fetchWithBases("SHP/border.shp")).url;
      const geojson = await shp(shpUrl);
      const boundaryLayer = L.geoJSON(geojson, { style: { color: "#ffb169", weight: 2, fillOpacity: 0.05 } });
      if (getLayerDisplay("study-boundary", "Study Boundary").defaultVisible !== false) boundaryLayer.addTo(map);
      registerOverlay(boundaryLayer, "study-boundary", () => Common.buildLegend({ id: "study-boundary", legendColors: ["#ffb169"] }, contentState.layerCatalog), "Study Boundary");
      if (!map._loadedBounds) {
        map.fitBounds(boundaryLayer.getBounds());
        map._loadedBounds = true;
      }
    } catch (error) {
      console.warn("Boundary layer load failed:", error);
    }
  }

  function addPoints() {
    monitoringLayer = L.layerGroup();
    refreshMonitoringLayer();
    if (getLayerDisplay("monitoring-points", "Monitoring Points").defaultVisible !== false) monitoringLayer.addTo(map);
    registerOverlay(monitoringLayer, "monitoring-points", () => Common.buildLegend({ id: "monitoring-points", legendColors: ["#66e3c4"] }, contentState.layerCatalog), "Monitoring Points");
  }

  async function loadEditableContent() {
    const [datasetResult, appResult, pointsResult, layerResult] = await Promise.all([
      Common.loadConfig("dataset_content"),
      Common.loadConfig("app_content"),
      Common.loadConfig("monitoring_points"),
      Common.loadConfig("layer_catalog"),
    ]);
    contentState.datasetContent = datasetResult.data;
    contentState.appContent = appResult.data;
    contentState.monitoringPoints = pointsResult.data;
    contentState.layerCatalog = layerResult.data;
    contentState.usedFallback = datasetResult.usedFallback || appResult.usedFallback || pointsResult.usedFallback || layerResult.usedFallback;
    applyPageContent();
  }

  async function init() {
    legendContent.textContent = I18N.t("messages.activateLayerLegend");
    if (metaSummary) metaSummary.textContent = I18N.t("messages.loadingMetadata");
    totalRasterCount = Common.getRasterConfigs().length;
    renderDashboardSummary();
    rebuildLayerControl();
    await loadEditableContent();
    await loadRasterIndex();

    const rasterConfigs = Common.getRasterConfigs();
    for (const config of rasterConfigs) {
      try {
        const text = await Common.fetchText(config.mdPath);
        const parsed = Common.parseMetadata(text);
        config.min = parsed.min;
        config.max = parsed.max;
        if (parsed.fileName) config.tifPath = `TIF/${parsed.fileName}`;
        if (parsed.bounds) config.bounds = parsed.bounds;
        if (parsed.fileName && rasterIndexBounds[parsed.fileName]) config.bounds = rasterIndexBounds[parsed.fileName];
        if (parsed.bounds && !map._loadedBounds) {
          map.fitBounds(parsed.bounds);
          map._loadedBounds = true;
        }
        loadedMetadataCount += 1;
      } catch (error) {
        console.warn(`Metadata load failed for ${config.id}:`, error);
      }
      await loadRasterLayer(config);
      renderDashboardSummary();
    }

    if (metaSummary) {
      metaSummary.textContent = loadedMetadataCount
        ? I18N.t("messages.loadedMetadata", { count: loadedMetadataCount })
        : I18N.t("messages.metadataNotFound");
    }

    await loadShapefile();
    addPoints();
    renderOverlaySummaries();
    renderLegends();
  }

  map.on("overlayadd", () => {
    renderOverlaySummaries();
    renderLegends();
  });
  map.on("overlayremove", () => {
    renderOverlaySummaries();
    renderLegends();
  });

  I18N.onChange(() => {
    applyPageContent();
    refreshMonitoringLayer();
    renderOverlaySummaries();
    renderLegends();
    rebuildLayerControl();
    renderDashboardSummary();
  });

  init();
}());
