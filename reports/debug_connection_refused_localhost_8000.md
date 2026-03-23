# Localhost 8000 Connection Refused Debug Report

## 1. Root cause found

The immediate cause of `ERR_CONNECTION_REFUSED` was that nothing was listening on `localhost:8000` at the time of the browser request.

During validation, `Get-NetTCPConnection` showed no listener on port `8000`, which means the browser error was caused by the local Python server not running rather than by a frontend rendering problem.

A second issue was also identified: the documented browser path was wrong. The app is served from the `vs/` directory as the server root, so the correct URLs are:

- `/index.html`
- `/datasets.html`
- `/admin.html`

not `/vs/index.html` or `/vs/datasets.html`.

## 2. Issue classification

- Primary issue: `server not running`
- Secondary issue: `wrong route documented in README`
- Not the issue:
  - server crash on startup
  - wrong port default
  - missing `datasets.html`

## 3. Exact files inspected

- `README.md`
- `vs/server.py`
- `vs/index.html`
- `vs/datasets.html`
- `vs/admin.html`

## 4. Exact files modified

- `README.md`
- `reports/debug_connection_refused_localhost_8000.md`

## 5. Exact fix made

- Corrected the README browser URLs so they match how `vs/server.py` actually serves files.
- No backend code change was required for connectivity.

## 6. How the app is supposed to run

- Start command: run `vs/server.py` from the project root.
- Port binding: defaults to port `8000` via `PORT = int(os.environ.get("PORT", "8000"))`
- Host binding: `("", PORT)` which makes it reachable on `localhost` / `127.0.0.1`
- Static files: served by `SimpleHTTPRequestHandler(directory=str(ROOT))` where `ROOT` is the `vs/` folder
- API routes: `/api/...` are served by the same Python server

## 7. Startup / route validation performed

- Confirmed no process was listening on port `8000` before startup.
- Started the server successfully with no startup traceback.
- Confirmed these URLs returned HTTP 200 while the server was running:
  - `http://127.0.0.1:8000/index.html`
  - `http://127.0.0.1:8000/datasets.html`
  - `http://127.0.0.1:8000/admin.html`
  - `http://127.0.0.1:8000/api/admin/health`
- Confirmed the documented `/vs/...` path was incorrect for this server setup.

## 8. Correct run command

From the project root:

```powershell
& .\.venv\Scripts\python.exe .\vs\server.py
```

If port `8000` is occupied:

```powershell
$env:PORT = '8001'
& .\.venv\Scripts\python.exe .\vs\server.py
```

## 9. Correct browser URLs to test

With the default port:

- `http://127.0.0.1:8000/index.html`
- `http://127.0.0.1:8000/datasets.html`
- `http://127.0.0.1:8000/admin.html`

If using port `8001`:

- `http://127.0.0.1:8001/index.html`
- `http://127.0.0.1:8001/datasets.html`
- `http://127.0.0.1:8001/admin.html`

## 10. Remaining manual checks

- Keep the server terminal open while testing in the browser.
- Confirm the terminal prints `Serving ... on http://localhost:8000`.
- If the browser still shows connection refused, verify the server process is still running and that no security software is blocking local connections.
- If port `8000` is already in use, switch to `8001` and open the matching URL.
