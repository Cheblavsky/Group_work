# Environmental Character Dashboard

## Project purpose
This project is a Leaflet-based environmental dashboard for exploring raster, vector, and monitoring-point layers around the study area. It was refactored into a small multi-page app with multilingual support and a local admin tool so key content can be updated without editing source code.

## Main features
- Map-first dashboard with raster, shapefile, and monitoring-point overlays
- Separate datasets catalog page to keep the dashboard uncluttered
- Local admin page for editing JSON-backed content
- Shared multilingual UI in English, Chinese, Hungarian, and Kurdish
- Config-driven monitoring points, dataset copy, page copy, and layer catalog
- Simple Python server with config read/write API, validation, and automatic backups

## Page structure
- `vs/index.html`: dashboard page with the Leaflet map, active layers, legend, and compact layer overview
- `vs/datasets.html`: dataset catalog page with localized titles, summaries, tags, and Markdown-derived technical metadata
- `vs/admin.html`: local-development admin page for editing monitoring points, dataset text, page text, and layer catalog content

## Multilingual support
System UI labels are centralized in `vs/i18n.js`.
Supported UI languages:
- English (`en`)
- Chinese (`zh`)
- Hungarian (`hu`)
- Kurdish (`ku`)

Editable domain content stays in JSON config files under `vs/config/`. The app selects the active language from the shared header selector and persists it in `localStorage`.

## Editable config overview
These files are editable through the admin UI and server API:
- `vs/config/monitoring_points.json`
- `vs/config/dataset_content.json`
- `vs/config/app_content.json`
- `vs/config/layer_catalog.json`

Each save creates a timestamped backup in `vs/backups/`.

## How to run locally
1. Open a terminal in the project root.
2. Start the local server:
   ```powershell
   & C:/Users/BedeP/AppData/Local/Programs/Python/Python313/python.exe .\vs\server.py
   ```
3. If port `8000` is already in use, stop the other process or run with a different port:
   ```powershell
   $env:PORT = '8001'
   & C:/Users/BedeP/AppData/Local/Programs/Python/Python313/python.exe .\vs\server.py
   ```

## How to open the app in the browser
Open the server URL shown in the terminal, typically:
- `http://127.0.0.1:8000/vs/index.html`
- `http://127.0.0.1:8001/vs/index.html` if you changed the port

You can navigate between pages from the shared header.

## Project structure summary
- `vs/`: frontend pages, JS, CSS, server, configs, backups, and source data
- `vs/config/`: editable JSON-backed content
- `vs/backups/`: timestamped config backups written by the server API
- `vs/MD/`: Markdown reports used for technical raster metadata
- `vs/SHP/`: shapefile assets
- `vs/TIF/`: raster assets
- `docs/`: project documentation and manual QA checklist
- `reports/`: step-by-step implementation reports

## Admin limitations
The admin page is intentionally a local-development tool in this project stage.
- No authentication or user accounts
- No database
- No file upload workflow
- No geometry editing tools

## Known limitations
- Raster rendering rules, basemap wiring, and shapefile rendering remain code-defined
- Full browser QA still needs to be completed manually before submission
- If a config endpoint fails, the frontend falls back to bundled defaults rather than blocking the UI
- Browser tab titles are static and not dynamically localized
