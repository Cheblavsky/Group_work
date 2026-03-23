# Dashboard Render Debug Report

## 1. Root cause found

The dashboard startup was crashing before any overlay registration happened.

- In `vs/script.js`, `metaSummary` was queried with `document.getElementById("meta-summary")` before `Common.renderHeader(...)` injected the header markup that actually contains that element.
- During `init()`, the first write to `metaSummary.textContent` threw a runtime exception because `metaSummary` was `null`.
- That stopped execution before:
  - editable config content was applied to the left panel,
  - raster/vector/point overlays were registered,
  - active-layer calculations ran,
  - legend rendering had any active layer data to show.

This matches the visible symptom: header/base map rendered, but the content-driven dashboard pipeline never completed.

## 2. Files modified

- `vs/script.js`
- `vs/app-common.js`
- `reports/debug_dashboard_render_issue.md`

## 3. What was fixed

### Startup crash fix

- Changed the header render call to capture the returned `meta-summary` element after the header is created.
- Added a null guard before updating `metaSummary` so this part of the page cannot crash startup again.

### Layer/content rendering fixes

- Fixed several `getLayerDisplay(...)` call sites in `vs/script.js` that were passing arguments in the wrong order.
- Those call sites now consistently use `contentState.layerCatalog`, so the loaded layer catalog controls:
  - layer control labels,
  - active layer list,
  - summary counts,
  - legend visibility checks,
  - left-panel available-layer rendering.

### Defensive rendering

- Invalid layer catalog entries are now skipped in the left-panel layer list instead of breaking rendering.
- Legend rendering now tolerates missing item color/label/title values.
- `vs/app-common.js` now filters malformed legend items before rendering them.

## 4. Config mismatches corrected

No layer-id mismatch was found between the configured catalog and the actual registered layers.

Verified IDs:

- `esa-worldcover`
- `srtm-dem`
- `jrc-water`
- `sentinel-2`
- `study-boundary`
- `monitoring-points`

No config file content had to be renamed for ID alignment.

## 5. Fallback / defensive logic added

- String booleans such as `"true"` / `"false"` are now normalized in `getLayerDisplay(...)` so manual config edits are less likely to break visibility logic.
- Missing or malformed catalog entries are skipped with a warning instead of taking down the panel.
- Missing legend fields now fall back to safe display values.

## 6. Startup flow traced

Dashboard startup path in `vs/script.js`:

1. Header renders through `Common.renderHeader(...)`
2. Leaflet map + basemap initialize
3. `init()` runs
4. `loadEditableContent()` loads:
   - `/api/config/dataset_content`
   - `/api/config/app_content`
   - `/api/config/monitoring_points`
   - `/api/config/layer_catalog`
5. `applyPageContent()` fills the left panel from config/fallback content
6. Raster metadata is read from Markdown reports and raster layers are registered
7. Shapefile boundary is loaded and registered
8. Monitoring points layer is created and registered
9. Active layers summary and legend are rendered from the registered overlays and active map state

Legend generation path:

- `renderLegends()` in `vs/script.js`
- `Common.buildLegend()` in `vs/app-common.js`
- legend definitions from `layer_catalog`

## 7. Default visibility verification

Configured default visible layers remain:

- `esa-worldcover`
- `study-boundary`
- `monitoring-points`

Non-default layers remain off by default:

- `srtm-dem`
- `jrc-water`
- `sentinel-2`

## 8. What still needs browser verification

- Confirm the dashboard no longer throws a console error on load.
- Confirm the left panel now shows intro, summary cards, and available layers.
- Confirm at least these default overlays appear active on initial load:
  - `esa-worldcover`
  - `study-boundary`
  - `monitoring-points`
- Confirm the active-layer list is populated.
- Confirm the right-side legend shows entries for active default layers instead of the placeholder message.
- Confirm language switching still updates header/panel/legend labels correctly.

## 9. Notes

- The JSON config files load successfully and the fallback path still exists if `/api/config/...` fails.
- I did not refactor the architecture or change the multi-page/admin/config-driven structure.
