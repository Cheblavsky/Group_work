# Architecture Summary

## Frontend shape
The project uses static frontend pages under `vs/`:
- `index.html`: dashboard
- `datasets.html`: dataset catalog
- `admin.html`: local admin tool

The pages share a common header, language selector, styling, and helper logic.

## Shared i18n layer
`vs/i18n.js` is the centralized system UI translation layer.
It contains:
- app title/subtitle
- navigation labels
- dashboard labels
- datasets-page labels
- admin labels
- buttons, field names, status messages, and empty-state messages

Language selection is persisted in `localStorage` and broadcast to each page through the shared i18n API.

## Config-driven content model
Editable domain content is stored in JSON under `vs/config/`:
- `monitoring_points.json`
- `dataset_content.json`
- `app_content.json`
- `layer_catalog.json`

This separation keeps user-editable environmental content out of hardcoded JavaScript while leaving system UI strings in `i18n.js`.

## Shared helpers
`vs/app-common.js` provides shared frontend utilities for:
- header rendering
- config loading and saving
- fallback to bundled defaults
- Markdown metadata parsing
- localized dataset/layer display lookup
- layer sorting and legend building

## Dashboard rendering
`vs/script.js` still owns the map runtime:
- Leaflet map initialization
- basemap setup
- raster loading and rendering
- shapefile loading
- monitoring-point marker creation
- active-layer and legend refresh behavior

The dashboard now reads user-facing layer titles, summaries, legend text, and lightweight visibility flags from `layer_catalog.json`.

## Datasets page rendering
`vs/datasets.js` merges two data sources:
- Markdown reports in `vs/MD/` for technical metadata
- `dataset_content.json` for localized title, summary, and tags

This keeps technical inspection data separate from reviewer-facing descriptive copy.

## Admin page rendering
`vs/admin.js` is a lightweight form-based editor for the JSON config files.
It loads content through the same server API used elsewhere and saves only after receiving a real backend response.

## server.py responsibilities
`vs/server.py` remains the local backend and static server. Its responsibilities include:
- serving project files
- existing raster/static access support
- `GET /api/admin/health`
- `GET /api/config/<name>`
- `PUT/POST /api/config/<name>`
- config validation
- whitelist and path-traversal protection
- timestamped backups before overwriting config files

## Markdown technical metadata vs config-driven content
Markdown reports remain the source for technical metadata such as:
- raster file names
- min/max values
- spatial bounds
- technical inspection notes

JSON config files now own the editable user-facing content such as:
- dataset titles, summaries, and tags
- monitoring point names and notes
- page-level explanatory copy
- layer titles, summaries, and legend labels

## What is still code-defined
The following areas remain intentionally code-owned:
- Leaflet map composition
- basemap URLs
- raster color ramps and rendering algorithms
- image-overlay fallback logic
- shapefile styling
- marker styles and popup layout
- backend request routing and validation logic
