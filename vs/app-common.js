(function () {
  const I18N = window.EnvDashI18n;
  const LOCALES = ["en", "zh", "hu", "ku"];

  const locationPath = window.location.pathname;
  const locationBase = locationPath.endsWith("/")
    ? locationPath
    : locationPath.slice(0, locationPath.lastIndexOf("/") + 1);
  const BASE_CANDIDATES = [locationBase, "", "vs/", "./vs/", "../vs/"];

  function buildAppUrl(relativePath, queryParams) {
    const url = new URL(relativePath, window.location.href);
    if (queryParams && typeof queryParams === "object") {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, value);
        }
      });
    }
    return url.toString();
  }

  const baseLayerConfigs = [
    {
      id: "carto-light",
      labelKey: "base.carto",
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      options: { maxZoom: 20, attribution: "&copy; OpenStreetMap contributors & Carto" },
    },
    {
      id: "openstreetmap",
      labelKey: "base.osm",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      options: { maxZoom: 20, attribution: "&copy; OpenStreetMap contributors" },
    },
    {
      id: "esri-imagery",
      labelKey: "base.esri",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      options: { maxZoom: 19, attribution: "Tiles &copy; Esri" },
    },
  ];

  const rasterConfigs = [
    {
      id: "esa-worldcover",
      mdPath: "MD/geotiff_report_ESA_WC.md",
      type: "categorical",
      typeKey: "dataset.type.categorical",
      defaultOn: true,
      legendKey: "legend.worldcover",
      legendColors: ["#0b6e4f", "#62a65e", "#b8d15a", "#f4c95d", "#d1495b", "#c7b198", "#3b8ed4", "#5ab1bb"],
      pixelValuesToColorFn(values) {
        const value = values[0];
        if (value === null || Number.isNaN(value)) return null;
        const palette = { 10: "#0b6e4f", 20: "#62a65e", 30: "#b8d15a", 40: "#f4c95d", 50: "#d1495b", 60: "#c7b198", 80: "#3b8ed4", 90: "#5ab1bb" };
        return palette[value] || "#6c757d";
      },
    },
    {
      id: "srtm-dem",
      mdPath: "MD/geotiff_report_SRTM.md",
      type: "continuous",
      typeKey: "dataset.type.continuous",
      legendKey: "legend.srtm",
      legendColors: ["#1f6f8b", "#99c1b9", "#f2d0a4"],
      colorStops: [
        { stop: 0, color: [31, 111, 139] },
        { stop: 0.5, color: [153, 193, 185] },
        { stop: 1, color: [242, 208, 164] },
      ],
    },
    {
      id: "jrc-water",
      mdPath: "MD/geotiff_report_JRC.md",
      type: "continuous",
      typeKey: "dataset.type.continuous",
      legendKey: "legend.jrc",
      legendColors: ["#cfe8ff", "#6db1e8", "#205493"],
      colorStops: [
        { stop: 0, color: [207, 232, 255] },
        { stop: 0.5, color: [109, 177, 232] },
        { stop: 1, color: [32, 84, 147] },
      ],
    },
    {
      id: "sentinel-2",
      mdPath: "MD/geotiff_report_Senti2.md",
      type: "multiband",
      typeKey: "dataset.type.multiband",
      legendKey: "legend.sentinel",
      legendColors: ["#8fb7ff", "#5dbb63", "#d77a61"],
    },
  ];

  const staticDatasetEntries = [
    { id: "study-boundary", typeKey: "dataset.type.vector", sourceFile: "border.shp", metadataSource: "SHP/border.shp" },
    { id: "monitoring-points", typeKey: "dataset.type.point", sourceFile: "In-script points", metadataSource: "scripted" },
  ];

  const defaultConfigs = {
    monitoring_points: {
      points: [
        {
          id: "wetland-monitor",
          coords: [46.267, 20.112],
          name: { en: "Szeged Wetland Monitor", zh: "塞格德湿地监测站", hu: "Szegedi mocsar monitor", ku: "چاودێری تەڕاوێتی سەگێد" },
          note: { en: "Seasonal water sensor cluster.", zh: "季节性水体传感器簇。", hu: "Szezonalis vizszenzor klaszter.", ku: "کۆمەڵە سێنسەری ئاوی وەرزی." },
        },
        {
          id: "agricultural-observatory",
          coords: [46.305, 20.175],
          name: { en: "Agricultural Observatory", zh: "农业观测站", hu: "Mezogazdasagi obszervatorium", ku: "چاودێری کشتوکاڵ" },
          note: { en: "Crop moisture readings.", zh: "作物湿度读数。", hu: "Noveny nedvesseg meresek.", ku: "خوێندنەوەی تریی کشتوکاڵ." },
        },
        {
          id: "urban-heat-station",
          coords: [46.283, 20.153],
          name: { en: "Urban Heat Station", zh: "城市热岛站", hu: "Varosi hoallomas", ku: "وێستگەی گەرمای شارستانی" },
          note: { en: "Built-up surface temperature.", zh: "建成区地表温度。", hu: "Beepitett felszini homerseklet.", ku: "پلەی گەرمی ڕووی زەویی بناکراو." },
        },
      ],
    },
    dataset_content: {
      datasets: [
        { id: "esa-worldcover", title: { en: "ESA WorldCover (2024)", zh: "ESA WorldCover (2024)", hu: "ESA WorldCover (2024)", ku: "ESA WorldCover (2024)" }, summary: { en: "Categorical land-cover raster used to compare vegetation, cropland, built surfaces, and water classes.", zh: "用于对比植被、耕地、建设用地和水体类别的土地覆盖分类栅格。", hu: "Kategoriakra bontott felszinboritas raster a novenyzet, szantofold, beepitett felszinek es vizek osszehasonlitasahoz.", ku: "ڕاستەری پۆلکراوی داپۆشینی زەوی بۆ بەراوردی ڕووەک و کشتوکاڵ و بناکراو و پۆلەکانی ئاو." }, tags: { en: ["Raster", "Land cover"], zh: ["栅格", "土地覆盖"], hu: ["Raster", "Felszinboritas"], ku: ["ڕاستەر", "داپۆشینی زەوی"] } },
        { id: "srtm-dem", title: { en: "SRTM Elevation", zh: "SRTM 高程", hu: "SRTM domborzat", ku: "SRTM بەرزی" }, summary: { en: "Digital elevation model highlighting local terrain variation across the study area.", zh: "显示研究区局部地形变化的数字高程模型。", hu: "Digitalis domborzatmodell, amely a vizsgalati terulet helyi terepvaltozasait mutatja.", ku: "مۆدێلی دیجیتاڵی بەرزی کە گۆڕانی ئاستی زەوی لە ناوچەی توێژینەوە دیار دەکات." }, tags: { en: ["Raster", "Elevation"], zh: ["栅格", "高程"], hu: ["Raster", "Magassag"], ku: ["ڕاستەر", "بەرزی"] } },
        { id: "jrc-water", title: { en: "JRC Surface Water Occurrence", zh: "JRC 地表水出现频率", hu: "JRC felszini viz elofordulas", ku: "JRC بوونی ئاو لەسەر زەوی" }, summary: { en: "Water occurrence raster showing where surface water appears rarely, seasonally, or persistently.", zh: "显示地表水罕见、季节性或常年出现位置的水体频率栅格。", hu: "Felszini viz elofordulasi raster, amely ritka, szezonalis vagy allando vizes teruleteket mutat.", ku: "ڕاستەری بوونی ئاو کە شوێنی ئاوە کەم و وەرزی و هەمیشەییەکان پیشان دەدات." }, tags: { en: ["Raster", "Water"], zh: ["栅格", "水体"], hu: ["Raster", "Viz"], ku: ["ڕاستەر", "ئاو"] } },
        { id: "sentinel-2", title: { en: "Sentinel-2 RGB", zh: "Sentinel-2 RGB", hu: "Sentinel-2 RGB", ku: "Sentinel-2 RGB" }, summary: { en: "Multiband optical imagery used for a quick visual comparison of vegetation, built-up areas, and water.", zh: "用于快速对比植被、建成区和水体的多波段光学影像。", hu: "Tobbcsatornas optikai felvetel a novenyzet, beepitett teruletek es vizek gyors vizualis osszehasonlitasahoz.", ku: "وێنەی ئۆپتیکی فرە-باند بۆ بەراوردی خێرای ڕووەک و بناکراو و ئاو." }, tags: { en: ["Raster", "Satellite"], zh: ["栅格", "卫星"], hu: ["Raster", "Muho"], ku: ["ڕاستەر", "مانگ دەست"] } },
        { id: "study-boundary", title: { en: "Study Boundary", zh: "研究边界", hu: "Vizsgalati hatar", ku: "سنوری ناوچەی توێژینەوە" }, summary: { en: "Vector boundary that frames the study extent used by the dashboard.", zh: "用于界定仪表板研究范围的矢量边界。", hu: "A dashboard altal hasznalt vizsgalati kiterjedest jelolo vektor hatar.", ku: "سنوری ڤێکتەری کە سنوری ناوچەی توێژینەوە دیاری دەکات." }, tags: { en: ["Vector", "Boundary"], zh: ["矢量", "边界"], hu: ["Vektor", "Hatar"], ku: ["ڤێکتەر", "سنور"] } },
        { id: "monitoring-points", title: { en: "Monitoring Points", zh: "监测点", hu: "Monitoring pontok", ku: "خاڵەکانی چاودێری" }, summary: { en: "Reference observation locations for local environmental monitoring.", zh: "本地环境监测的参考观测位置。", hu: "Referencia megfigyelési helyek helyi kornyezeti monitorozashoz.", ku: "شوێنی چاودێری سەرچاوە بۆ چاودێری ژینگه یی ناوخۆیی." }, tags: { en: ["Point", "Monitoring"], zh: ["点", "监测"], hu: ["Pont", "Monitorozas"], ku: ["خاڵ", "چاودێری"] } },
      ],
    },
    app_content: {
      dashboard: {
        intro: { en: "Use the dashboard to compare active raster, vector, and point layers without leaving the map view.", zh: "使用仪表板可在不离开地图视图的情况下比较活动的栅格、矢量和点图层。", hu: "A dashboarddal ugy hasonlithatod ossze az aktiv raster, vektor es pont retegeket, hogy kozben a terkepen maradsz.", ku: "لە داشبۆرددا دەتوانیت ڕاستەر و ڤێکتەر و خاڵە چالاکەکان بەراورد بکەیت بەبێ جێهێشتنی نەخشە." },
        summary: { en: "Editable content now comes from local JSON config files, so non-developers can update key texts and points from the admin page.", zh: "可编辑内容现在来自本地 JSON 配置文件，因此非开发人员也可以从管理页更新关键文本和监测点。", hu: "A szerkesztheto tartalom most helyi JSON konfiguraciobol jon, igy a nem fejlesztok is frissithetik a kulcs szovegeket es pontokat az admin oldalon.", ku: "ناوەڕۆکی دەستکاریکراو ئێستا لە فایلی JSON دێت، بۆیە نا-پەرەپێدەرانیش دەتوانن دەق و خاڵەکان لە پەڕەی ئادمین نوێ بکەنەوە." },
      },
      datasets: {
        intro: { en: "Browse editable dataset descriptions here while technical metadata remains tied to the existing Markdown reports.", zh: "在这里浏览可编辑的数据集说明，同时技术元数据仍然来自现有 Markdown 报告。", hu: "Itt bongeszheted a szerkesztheto adatleirasokat, mikozben a technikai metaadatok tovabbra is a meglevo Markdown riportokbol jonnek.", ku: "لێرە پێناساندنی داتاسێت ببینە، هەروەها میتاداتای تەکنیکی هێشتا لە راپۆرتەکانی Markdown دێت." },
      },
      admin: {
        overview: { en: "This local-development admin page lets non-developers maintain monitoring points and localized content without editing source code.", zh: "这个本地开发管理页允许非开发人员在不修改源代码的情况下维护监测点和多语言内容。", hu: "Ez a helyi fejlesztesi admin oldal lehetove teszi, hogy nem fejlesztok is karbantartsak a monitoring pontokat es a lokalizalt tartalmat forraskod szerkesztese nelkul.", ku: "ئەم پەڕەی ئادمینی پەرەپێدانە ناوخۆییە ڕێگا دەدات نا-پەرەپێدەرەکان خاڵەکانی چاودێری و ناوەڕۆکی فرەزمانی نوێ بکەنەوە بەبێ دەستکاریکردنی کۆد." },
        notice: { en: "No authentication is enabled in this step. Treat this as a local-development admin tool only.", zh: "本步骤未启用身份验证。请仅将其视为本地开发管理工具。", hu: "Ebben a lepesben nincs hitelesites. Ezt csak helyi fejlesztesi admin eszkozkent kezeld.", ku: "لە ئەم هەنگاوەدا هیچ پشتڕاستکردنەوەی ناسنامەیەک نییە. تەنیا وەک ئامرازێکی ئادمینی پەرەپێدانی ناوخۆ بەکاردەهێنرێت." },
      },
    },
    layer_catalog: {
      layers: [
        { id: "esa-worldcover", kind: "raster", title: { en: "ESA WorldCover (2024)", zh: "ESA WorldCover (2024)", hu: "ESA WorldCover (2024)", ku: "ESA WorldCover (2024)" }, summary: { en: "Land-cover classification layer for comparing vegetation, cropland, built surfaces, and water classes.", zh: "用于比较植被、耕地、建设用地和水体类别的土地覆盖分类图层。", hu: "Felszinboritasi osztalyozo reteg a novenyzet, szantofold, beepitett felszinek es vizek osszehasonlitasahoz.", ku: "لایەی پۆلکردنی داپۆشینی زەوی بۆ بەراوردی ڕووەک و کشتوکاڵ و بناکراو و پۆلەکانی ئاو." }, defaultVisible: true, showInLegend: true, showInActiveLayers: true, sortOrder: 10, legend: { title: { en: "WorldCover classes", zh: "WorldCover 类别", hu: "WorldCover osztalyok", ku: "پۆلەکانی WorldCover" }, items: [ { id: "tree", label: { en: "Tree cover", zh: "树木覆盖", hu: "Faboritas", ku: "داپۆشینی دار" } }, { id: "shrub", label: { en: "Shrubland", zh: "灌木地", hu: "Cserjes", ku: "دارچە" } }, { id: "grass", label: { en: "Grassland", zh: "草地", hu: "Gyep", ku: "گیا" } }, { id: "crop", label: { en: "Cropland", zh: "耕地", hu: "Szantofold", ku: "کشتوکاڵ" } }, { id: "built", label: { en: "Built-up", zh: "建设用地", hu: "Beepitett", ku: "بناکراو" } }, { id: "bare", label: { en: "Bare / sparse", zh: "裸地 / 稀疏植被", hu: "Kopar / ritkas", ku: "ڕووت / کەم گیایی" } }, { id: "water", label: { en: "Permanent water", zh: "永久水体", hu: "Allando viz", ku: "ئاوە هەمیشەییەکان" } }, { id: "wetland", label: { en: "Herbaceous wetland", zh: "草本湿地", hu: "Lagy szaru vizes elohely", ku: "ناوچەی تەڕی گیاوی" } } ] } },
        { id: "srtm-dem", kind: "raster", title: { en: "SRTM Elevation", zh: "SRTM 高程", hu: "SRTM domborzat", ku: "SRTM بەرزی" }, summary: { en: "Elevation layer highlighting terrain variation across the study area.", zh: "突出显示研究区地形变化的高程图层。", hu: "Magassagi reteg, amely a vizsgalati terulet terepvaltozasait emeli ki.", ku: "لایەی بەرزی کە گۆڕانی ئاستی زەوی لە ناوچەی توێژینەوە دەخاتە ڕوو." }, defaultVisible: false, showInLegend: true, showInActiveLayers: true, sortOrder: 20, legend: { title: { en: "Elevation (m)", zh: "高程 (m)", hu: "Magassag (m)", ku: "بەرزی (m)" } } },
        { id: "jrc-water", kind: "raster", title: { en: "JRC Surface Water Occurrence", zh: "JRC 地表水出现频率", hu: "JRC felszini viz elofordulas", ku: "JRC بوونی ئاو لەسەر زەوی" }, summary: { en: "Surface-water occurrence layer showing rare, seasonal, and persistent water patterns.", zh: "显示罕见、季节性和持续性水体模式的地表水出现图层。", hu: "Felszini viz elofordulasi reteg, amely ritka, szezonalis es tartos vizmintazatokat mutat.", ku: "لایەی بوونی ئاو لەسەر زەوی کە نەخشەی ئاوی کەم و وەرزی و بەردەوام پیشان دەدات." }, defaultVisible: false, showInLegend: true, showInActiveLayers: true, sortOrder: 30, legend: { title: { en: "Water occurrence (%)", zh: "水体出现率 (%)", hu: "Viz elofordulas (%)", ku: "بوونی ئاو (%)" }, items: [ { id: "rare", label: { en: "Rare", zh: "罕见", hu: "Ritka", ku: "کەم" } }, { id: "seasonal", label: { en: "Seasonal", zh: "季节性", hu: "Szezonalis", ku: "وەرزی" } }, { id: "permanent", label: { en: "Permanent", zh: "常年", hu: "Allando", ku: "هەمیشەیی" } } ] } },
        { id: "sentinel-2", kind: "raster", title: { en: "Sentinel-2 RGB", zh: "Sentinel-2 RGB", hu: "Sentinel-2 RGB", ku: "Sentinel-2 RGB" }, summary: { en: "Multiband optical imagery for quick visual comparison of vegetation, built-up areas, and water.", zh: "用于快速比较植被、建成区和水体的多波段光学影像。", hu: "Tobbcsatornas optikai felvetel a novenyzet, beepitett teruletek es vizek gyors vizualis osszehasonlitasahoz.", ku: "وێنەی ئۆپتیکی فرە-باند بۆ بەراوردی خێرای ڕووەک و بناکراو و ئاو." }, defaultVisible: false, showInLegend: true, showInActiveLayers: true, sortOrder: 40, legend: { title: { en: "Sentinel-2", zh: "Sentinel-2", hu: "Sentinel-2", ku: "Sentinel-2" }, items: [ { id: "rgb", label: { en: "RGB composite", zh: "RGB 合成", hu: "RGB kompozit", ku: "کۆمپۆزیتی RGB" } }, { id: "vegetation", label: { en: "Vegetation", zh: "植被", hu: "Novenyzet", ku: "ڕووەک" } }, { id: "built", label: { en: "Built-up", zh: "建设用地", hu: "Beepitett", ku: "بناکراو" } } ] } },
        { id: "study-boundary", kind: "vector", title: { en: "Study Boundary", zh: "研究边界", hu: "Vizsgalati hatar", ku: "سنوری ناوچەی توێژینەوە" }, summary: { en: "Boundary layer that frames the study extent used by the dashboard.", zh: "用于界定仪表板研究范围的边界图层。", hu: "Hatarreteg, amely kijeloli a dashboard altal hasznalt vizsgalati kiterjedest.", ku: "لایەی سنور کە سنوری ناوچەی توێژینەوەی داشبۆرد دیاری دەکات." }, defaultVisible: true, showInLegend: true, showInActiveLayers: true, sortOrder: 50, legend: { title: { en: "Boundary", zh: "边界", hu: "Hatar", ku: "سنور" }, items: [ { id: "clip-extent", label: { en: "Clip extent", zh: "裁剪范围", hu: "Kivagas terulete", ku: "ڕووبەری بڕاو" } } ] } },
        { id: "monitoring-points", kind: "points", title: { en: "Monitoring Points", zh: "监测点", hu: "Monitoring pontok", ku: "خاڵەکانی چاودێری" }, summary: { en: "Reference observation points for local environmental monitoring.", zh: "本地环境监测的参考观测点。", hu: "Referencia megfigyelési pontok helyi kornyezeti monitorozashoz.", ku: "خاڵی سەرچاوە بۆ چاودێری ژینگه یی ناوخۆیی." }, defaultVisible: true, showInLegend: true, showInActiveLayers: true, sortOrder: 60, legend: { title: { en: "Monitoring points", zh: "监测点", hu: "Monitoring pontok", ku: "خاڵەکانی چاودێری" }, items: [ { id: "sensor", label: { en: "Sensors", zh: "传感器", hu: "Szenzorok", ku: "سێنسەر" } } ] } },
      ],
    },
  };

  function clone(value) {
    if (Array.isArray(value)) return value.map((item) => clone(item));
    if (value && typeof value === "object") {
      const result = {};
      Object.keys(value).forEach((key) => {
        result[key] = clone(value[key]);
      });
      return result;
    }
    return value;
  }

  function getLanguageLabel(language) {
    return I18N.getLanguageName(language);
  }

  function getDefaultConfig(name) {
    return clone(defaultConfigs[name]);
  }

  function pickLocalizedValue(localized, fallbackValue) {
    if (!localized || typeof localized !== "object") return fallbackValue || "";
    const language = I18N.getLanguage();
    return localized[language] || localized.en || Object.values(localized).find((value) => typeof value === "string" && value.trim()) || fallbackValue || "";
  }

  function pickLocalizedList(localized, fallbackValue) {
    if (!localized || typeof localized !== "object") return fallbackValue || [];
    const language = I18N.getLanguage();
    const value = localized[language] || localized.en || Object.values(localized).find((item) => Array.isArray(item));
    return Array.isArray(value) ? value : fallbackValue || [];
  }

  function getConfigEntry(list, id) {
    if (!Array.isArray(list)) return null;
    return list.find((entry) => entry && typeof entry === "object" && entry.id === id) || null;
  }

  function normalizeBoolean(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
    return undefined;
  }

  function renderHeader(options) {
    const container = document.getElementById(options.containerId);
    if (!container) return null;
    container.innerHTML = `
      <div class="brand">
        <div class="brand-mark">VS</div>
        <div class="brand-text">
          <div class="brand-title" data-i18n="app.title"></div>
          <div class="brand-subtitle" data-i18n="app.subtitle"></div>
        </div>
      </div>
      <nav class="header-center" aria-label="Primary">
        <a class="nav-link ${options.activePage === "dashboard" ? "active" : ""}" href="index.html" data-i18n="nav.dashboard"></a>
        <a class="nav-link ${options.activePage === "datasets" ? "active" : ""}" href="datasets.html" data-i18n="nav.datasets"></a>
        <a class="nav-link ${options.activePage === "admin" ? "active" : ""}" href="admin.html" data-i18n="nav.admin"></a>
      </nav>
      <div class="header-tools">
        <div class="header-meta" id="${options.metaId || ""}"></div>
        <label class="language-switcher">
          <span data-i18n="common.language"></span>
          <select id="language-select" class="language-select" aria-label="Language selector"></select>
        </label>
      </div>
    `;
    const select = container.querySelector("#language-select");
    I18N.getLanguages().forEach((language) => {
      const option = document.createElement("option");
      option.value = language;
      option.textContent = I18N.getLanguageName(language);
      select.appendChild(option);
    });
    select.value = I18N.getLanguage();
    select.addEventListener("change", (event) => I18N.setLanguage(event.target.value));
    I18N.applyTranslations(container);
    return container.querySelector(`#${options.metaId}`);
  }



  async function buildHttpError(response) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(data.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.payload = data;
    return error;
  }

  async function fetchWithBases(relativePath, options) {
    let lastError = null;
    for (const base of BASE_CANDIDATES) {
      const url = new URL(`${base}${relativePath}`, window.location.href).toString();
      try {
        const response = await fetch(url, { cache: "no-store", ...(options || {}) });
        if (response.ok) return response;
        lastError = new Error(`HTTP ${response.status} for ${url}`);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error(`Unable to fetch ${relativePath}`);
  }

  async function fetchText(relativePath) {
    const response = await fetchWithBases(relativePath);
    return response.text();
  }

  async function resolveUrl(relativePath) {
    const response = await fetchWithBases(relativePath, { method: "HEAD" });
    return response.url;
  }

  async function loadConfig(name) {
    try {
      const response = await fetch(`/api/config/${name}`, { cache: "no-store" });
      if (!response.ok) throw await buildHttpError(response);
      return { data: await response.json(), usedFallback: false, error: null };
    } catch (error) {
      if (error && error.status === 401) throw error;
      console.warn(`Falling back to default config for ${name}:`, error);
      return { data: getDefaultConfig(name), usedFallback: true, error };
    }
  }

  async function saveConfig(name, payload, method = "PUT") {
    const response = await fetch(`/api/config/${name}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || `HTTP ${response.status}`);
      error.status = response.status;
      error.payload = data;
      throw error;
    }
    return data;
  }

  async function fetchAdminHealth() {
    const response = await fetch("/api/admin/health", { cache: "no-store" });
    if (!response.ok) throw await buildHttpError(response);
    return response.json();
  }

  async function fetchAdminAuthStatus() {
    const response = await fetch("/api/auth/status", { cache: "no-store" });
    if (!response.ok) throw await buildHttpError(response);
    return response.json();
  }

  async function loginAdmin(password) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || `HTTP ${response.status}`);
      error.status = response.status;
      error.payload = data;
      throw error;
    }
    return data;
  }

  async function logoutAdmin() {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || `HTTP ${response.status}`);
      error.status = response.status;
      error.payload = data;
      throw error;
    }
    return data;
  }

  function extractSection(markdown, heading) {
    const expression = new RegExp(`## ${heading}\\s*[\\r\\n]+([\\s\\S]*?)(?=\\n## |$)`);
    const match = markdown.match(expression);
    return match ? match[1].trim() : "";
  }

  function parseMetadata(markdown) {
    const fileMatch = markdown.match(/- File:\s*(.+)/);
    const filePath = fileMatch ? fileMatch[1].trim() : "";
    const fileName = filePath ? filePath.split(/[\\/]/).pop() : "";
    const description = extractSection(markdown, "What it appears to be");
    const summaryLine = description.split("\n").map((line) => line.replace(/^[-*]\s*/, "").trim()).find((line) => line.length > 0);
    const statsSection = extractSection(markdown, "Simple statistics");
    const minMatch = statsSection.match(/- Minimum:\s*([\d.]+)/);
    const maxMatch = statsSection.match(/- Maximum:\s*([\d.]+)/);
    const boundsSection = extractSection(markdown, "Spatial extent");
    const boundsMatch = boundsSection.match(/Bounds:\s*left=([\d.]+),\s*bottom=([\d.]+),\s*right=([\d.]+),\s*top=([\d.]+)/);
    return {
      fileName,
      summary: summaryLine || I18N.t("messages.metadataUnavailable"),
      min: minMatch ? Number(minMatch[1]) : null,
      max: maxMatch ? Number(maxMatch[1]) : null,
      bounds: boundsMatch ? [[Number(boundsMatch[2]), Number(boundsMatch[1])], [Number(boundsMatch[4]), Number(boundsMatch[3])]] : null,
    };
  }

  function getDatasetDisplay(datasetId, datasetConfig) {
    const configData = datasetConfig || defaultConfigs.dataset_content;
    const entry = getConfigEntry(configData.datasets || [], datasetId) || getConfigEntry(defaultConfigs.dataset_content.datasets, datasetId) || { id: datasetId };
    return { id: datasetId, title: pickLocalizedValue(entry.title, datasetId), summary: pickLocalizedValue(entry.summary, ""), tags: pickLocalizedList(entry.tags, []) };
  }

  function getLayerCatalogEntry(layerId, layerConfig) {
    const configData = layerConfig || defaultConfigs.layer_catalog;
    return getConfigEntry(configData.layers || [], layerId) || getConfigEntry(defaultConfigs.layer_catalog.layers, layerId) || null;
  }

  function getLayerDisplay(layerId, layerConfig, fallbackTitle) {
    const entry = getLayerCatalogEntry(layerId, layerConfig);
    const defaultVisible = normalizeBoolean(entry?.defaultVisible);
    const showInLegend = normalizeBoolean(entry?.showInLegend);
    const showInActiveLayers = normalizeBoolean(entry?.showInActiveLayers);
    return {
      id: layerId,
      title: entry ? pickLocalizedValue(entry.title, fallbackTitle || layerId) : fallbackTitle || layerId,
      summary: entry ? pickLocalizedValue(entry.summary, "") : "",
      defaultVisible,
      showInLegend: showInLegend !== false,
      showInActiveLayers: showInActiveLayers !== false,
      sortOrder: Number.isFinite(entry?.sortOrder) ? entry.sortOrder : 999,
      legend: entry?.legend || null,
      kind: entry?.kind || "overlay",
    };
  }

  function getMonitoringPointsConfig(configData) {
    const source = configData || defaultConfigs.monitoring_points;
    return clone(source.points || defaultConfigs.monitoring_points.points);
  }

  function getAppContentValue(configData, section, field, fallback) {
    const source = configData || defaultConfigs.app_content;
    const localized = source?.[section]?.[field] || defaultConfigs.app_content?.[section]?.[field];
    return pickLocalizedValue(localized, fallback || "");
  }

  function buildLegend(config, layerConfig) {
    const layerDisplay = getLayerDisplay(config.id || config.layerId, layerConfig);
    const legendConfig = layerDisplay.legend;
    if (legendConfig) {
      const items = Array.isArray(legendConfig.items)
        ? legendConfig.items
          .filter((item) => item && typeof item === "object")
          .map((item, index) => ({ label: pickLocalizedValue(item.label, item.id || String(index)), color: item.color || (config.legendColors ? config.legendColors[index] : "#66e3c4") }))
        : null;
      if (items && items.length) {
        return { title: pickLocalizedValue(legendConfig.title, layerDisplay.title), items };
      }
      if (config.id === "srtm-dem") {
        const min = Math.round(config.min ?? 0);
        const max = Math.round(config.max ?? 100);
        const mid = Math.round((min + max) / 2);
        return {
          title: pickLocalizedValue(legendConfig.title, layerDisplay.title),
          items: [
            { label: I18N.t("legend.srtm.low", { value: min }), color: "#1f6f8b" },
            { label: I18N.t("legend.srtm.mid", { value: mid }), color: "#99c1b9" },
            { label: I18N.t("legend.srtm.high", { value: max }), color: "#f2d0a4" },
          ],
        };
      }
      return { title: pickLocalizedValue(legendConfig.title, layerDisplay.title), items: [] };
    }
    return null;
  }

  async function loadDatasetCatalog(datasetConfig) {
    const catalog = [];
    const contentData = datasetConfig || defaultConfigs.dataset_content;
    for (const config of clone(rasterConfigs)) {
      let summary = I18N.t("messages.metadataUnavailable");
      let sourceFile = "";
      try {
        const markdown = await fetchText(config.mdPath);
        const parsed = parseMetadata(markdown);
        summary = parsed.summary;
        sourceFile = parsed.fileName || "";
      } catch (error) {
        summary = I18N.t("messages.metadataUnavailable");
      }
      const display = getDatasetDisplay(config.id, contentData);
      catalog.push({ id: config.id, title: display.title, summary: display.summary || summary, tags: display.tags, typeKey: config.typeKey, sourceFile, metadataSource: config.mdPath });
    }
    staticDatasetEntries.forEach((entry) => {
      const display = getDatasetDisplay(entry.id, contentData);
      catalog.push({ id: entry.id, title: display.title, summary: display.summary, tags: display.tags, typeKey: entry.typeKey, sourceFile: entry.sourceFile, metadataSource: entry.metadataSource });
    });
    return catalog;
  }

  function sortLayersByCatalog(entries, layerConfig) {
    return [...entries].sort((left, right) => {
      const leftDisplay = getLayerDisplay(left.id || left.datasetId, layerConfig, left.fallbackTitle);
      const rightDisplay = getLayerDisplay(right.id || right.datasetId, layerConfig, right.fallbackTitle);
      if (leftDisplay.sortOrder !== rightDisplay.sortOrder) return leftDisplay.sortOrder - rightDisplay.sortOrder;
      return leftDisplay.title.localeCompare(rightDisplay.title);
    });
  }

  window.EnvDashCommon = {
    LOCALES,
    renderHeader,
    buildAppUrl,
    fetchWithBases,
    fetchText,
    resolveUrl,
    loadConfig,
    saveConfig,
    fetchAdminHealth,
    fetchAdminAuthStatus,
    loginAdmin,
    logoutAdmin,
    parseMetadata,
    buildLegend,
    getDatasetDisplay,
    getLayerCatalogEntry,
    getLayerDisplay,
    getMonitoringPointsConfig,
    getAppContentValue,
    loadDatasetCatalog,
    sortLayersByCatalog,
    getRasterConfigs: () => clone(rasterConfigs),
    getBaseLayerConfigs: () => clone(baseLayerConfigs),
    getDefaultConfig,
    getLanguageLabel,
  };
}());



