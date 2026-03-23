# Environmental Character Dashboard

## Project purpose
This project is a Leaflet-based environmental dashboard for exploring raster, vector, and monitoring-point layers around the study area. It uses a small multi-page frontend with multilingual support plus a local-development admin tool for editing JSON-backed content.

## Main features
- Map-first dashboard with raster, shapefile, and monitoring-point overlays
- Separate datasets catalog page to keep the dashboard uncluttered
- Local admin page for editing JSON-backed content
- Lightweight local admin login backed by a server-side session cookie
- Shared multilingual UI in English, Chinese, Hungarian, and Kurdish
- Config-driven monitoring points, dataset copy, page copy, and layer catalog
- Simple Python server with config read/write API, validation, and automatic backups

## Page structure
- `vs/index.html`: public dashboard page with the Leaflet map, active layers, and legend
- `vs/datasets.html`: public dataset catalog page with localized titles, summaries, tags, and Markdown-derived technical metadata
- `vs/login.html`: local admin login page
- `vs/admin.html`: protected local-development admin page for editing monitoring points, dataset text, page text, and layer catalog content

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

Each successful save creates a timestamped backup in `vs/backups/`.

## How to run locally
1. Open a terminal in the project root.
2. Optionally set a local admin password before starting the server:
   ```powershell
   $env:ADMIN_PASSWORD = 'your-local-password'
   ```
3. Start the local server:
   ```powershell
   & C:/Users/BedeP/AppData/Local/Programs/Python/Python313/python.exe .\vs\server.py
   ```
4. If port `8000` is already in use, stop the other process or run with a different port:
   ```powershell
   $env:PORT = '8001'
   & C:/Users/BedeP/AppData/Local/Programs/Python/Python313/python.exe .\vs\server.py
   ```

## Admin login behavior
This project now uses a lightweight local-development login for the admin area.
- Login URL: `http://127.0.0.1:8000/login.html`
- Protected page: `http://127.0.0.1:8000/admin.html`
- Public pages: `index.html` and `datasets.html`
- Protected writes: config save requests under `/api/config/*`
- Protected admin route: `/api/admin/health`
- Session type: in-memory server-side session identified by an HTTP-only cookie

### Password configuration
- Preferred option: set `ADMIN_PASSWORD` in the environment before starting `vs/server.py`
- Local fallback if `ADMIN_PASSWORD` is not set: `local-admin`
- The password is checked only on the server; frontend JS does not store the plaintext password as configuration

### Important note
This is intentionally a lightweight academic/local-development auth layer.
- It is not a production authentication system
- It does not include users, registration, password reset, roles, or a database
- Sessions live only in the running Python process and reset when the server restarts

## How to open the app in the browser
Open the server URL shown in the terminal, typically:
- `http://127.0.0.1:8000/index.html`
- `http://127.0.0.1:8000/datasets.html`
- `http://127.0.0.1:8000/login.html`
- `http://127.0.0.1:8000/admin.html`
- `http://127.0.0.1:8001/index.html` if you changed the port

You can navigate between pages from the shared header. Opening `admin.html` while logged out redirects to `login.html`.

## Project structure summary
- `vs/`: frontend pages, JS, CSS, server, configs, backups, and source data
- `vs/config/`: editable JSON-backed content
- `vs/backups/`: timestamped config backups written by the server API
- `vs/MD/`: Markdown reports used for technical raster metadata
- `vs/SHP/`: shapefile assets
- `vs/TIF/`: raster assets
- `docs/`: project documentation and manual QA checklist
- `reports/`: implementation reports

## Known limitations
- Admin auth is local-development only and not production-grade
- Sessions are stored in memory, so restarting the Python server logs admin users out
- Raster rendering rules, basemap wiring, and shapefile rendering remain code-defined
- Full browser QA still needs to be completed manually before submission
- If a config read endpoint fails, the public frontend falls back to bundled defaults rather than blocking the UI
- Browser tab titles are static and not dynamically localized
