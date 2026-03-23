import hmac
import http.server
import io
import json
import math
import os
import secrets
import socketserver
import time
from datetime import datetime
from http.cookies import SimpleCookie
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

import numpy as np
import rasterio
from PIL import Image
from rasterio.enums import Resampling

PORT = int(os.environ.get("PORT", "8000"))
RAW_ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "").strip()
DEFAULT_ADMIN_PASSWORD = "local-admin"
ADMIN_PASSWORD = RAW_ADMIN_PASSWORD or DEFAULT_ADMIN_PASSWORD
ADMIN_PASSWORD_SOURCE = "environment" if RAW_ADMIN_PASSWORD else "default"
SESSION_COOKIE_NAME = "envdash_admin_session"
SESSION_TTL_SECONDS = int(os.environ.get("ADMIN_SESSION_TTL_SECONDS", "28800"))
ROOT = Path(__file__).resolve().parent
TIF_DIR = ROOT / "TIF"
CONFIG_DIR = ROOT / "config"
BACKUP_DIR = ROOT / "backups"
MAX_RENDER_SIZE = 2048
LOCALES = ("en", "zh", "hu", "ku")
CONFIG_PATHS = {
    "monitoring_points": CONFIG_DIR / "monitoring_points.json",
    "dataset_content": CONFIG_DIR / "dataset_content.json",
    "app_content": CONFIG_DIR / "app_content.json",
    "layer_catalog": CONFIG_DIR / "layer_catalog.json",
}
SESSIONS = {}


def _scale_shape(width, height, max_size=MAX_RENDER_SIZE):
    scale = max(width, height) / max_size
    if scale <= 1:
        return width, height
    return int(width / scale), int(height / scale)


def _normalize_band(band):
    valid = np.isfinite(band)
    if not np.any(valid):
        return np.zeros_like(band, dtype=np.uint8), valid
    lo, hi = np.nanpercentile(band[valid], [2, 98])
    if hi == lo:
        scaled = np.zeros_like(band, dtype=np.float32)
    else:
        scaled = (band - lo) / (hi - lo)
    scaled = np.clip(scaled, 0, 1)
    return (scaled * 255).astype(np.uint8), valid


def _apply_gradient(data, vmin, vmax, stops, gamma=1.0):
    if vmax == vmin:
        vmax = vmin + 1
    t = (data - vmin) / (vmax - vmin)
    t = np.clip(t, 0, 1)
    if gamma != 1.0:
        t = np.power(t, gamma)
    positions = np.array([s[0] for s in stops])
    r_vals = np.array([s[1][0] for s in stops])
    g_vals = np.array([s[1][1] for s in stops])
    b_vals = np.array([s[1][2] for s in stops])
    r = np.interp(t, positions, r_vals)
    g = np.interp(t, positions, g_vals)
    b = np.interp(t, positions, b_vals)
    return np.stack([r, g, b], axis=-1).astype(np.uint8)


def _render_raster(tif_path):
    with rasterio.open(tif_path) as dataset:
        width, height = dataset.width, dataset.height
        out_w, out_h = _scale_shape(width, height)

        if dataset.count >= 3:
            data = dataset.read([1, 2, 3], out_shape=(3, out_h, out_w), resampling=Resampling.bilinear)
            rgb = []
            mask = None
            for band in data:
                band = band.astype(np.float32)
                scaled, valid = _normalize_band(band)
                rgb.append(scaled)
                mask = valid if mask is None else (mask | valid)
            rgb = np.stack(rgb, axis=-1)
            alpha = np.where(mask, 255, 0).astype(np.uint8)
        else:
            data = dataset.read(1, out_shape=(out_h, out_w), resampling=Resampling.bilinear).astype(np.float32)
            nodata = dataset.nodata
            mask = np.isfinite(data)
            if nodata is not None:
                mask &= data != nodata

            name = tif_path.name.lower()
            if "worldcover" in name:
                palette = {
                    10: (11, 110, 79),
                    20: (98, 166, 94),
                    30: (184, 209, 90),
                    40: (244, 201, 93),
                    50: (209, 73, 91),
                    60: (199, 177, 152),
                    80: (59, 142, 212),
                    90: (90, 177, 187),
                }
                rgb = np.full((out_h, out_w, 3), (108, 117, 125), dtype=np.uint8)
                for value, color in palette.items():
                    rgb[data == value] = color
            else:
                vmin = np.nanmin(data[mask]) if np.any(mask) else 0
                vmax = np.nanmax(data[mask]) if np.any(mask) else 1
                if "jrc" in name or "occurrence" in name:
                    stops = [(0.0, (207, 232, 255)), (0.5, (109, 177, 232)), (1.0, (32, 84, 147))]
                    gamma = 1.0
                else:
                    stops = [(0.0, (31, 111, 139)), (0.5, (153, 193, 185)), (1.0, (242, 208, 164))]
                    gamma = 0.85 if ("srtm" in name or "dem" in name or "dsm" in name) else 1.0
                    if gamma != 1.0 and np.any(mask):
                        vmin = np.nanpercentile(data[mask], 2)
                        vmax = np.nanpercentile(data[mask], 98)
                rgb = _apply_gradient(data, vmin, vmax, stops, gamma=gamma)

            alpha = np.where(mask, 245, 0).astype(np.uint8)

        rgba = np.dstack([rgb, alpha])
        image = Image.fromarray(rgba, mode="RGBA")
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        return buffer.getvalue()


def _json_error(message):
    return {"ok": False, "error": message}


def _json_ok(**extra):
    payload = {"ok": True}
    payload.update(extra)
    return payload


def _read_json(path):
    with path.open("r", encoding="utf-8-sig") as handle:
        return json.load(handle)


def _write_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def _backup_file(path, config_name):
    if not path.exists():
        return None
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = BACKUP_DIR / f"{config_name}_{stamp}.json"
    backup_path.write_text(path.read_text(encoding="utf-8-sig"), encoding="utf-8")
    return backup_path


def _validate_localized_strings(value, label):
    if not isinstance(value, dict):
        raise ValueError(f"{label} must be an object with locales {', '.join(LOCALES)}")
    for locale in LOCALES:
        locale_value = value.get(locale)
        if not isinstance(locale_value, str):
            raise ValueError(f"{label}.{locale} must be a string")


def _validate_localized_tags(value, label):
    if not isinstance(value, dict):
        raise ValueError(f"{label} must be an object with locales {', '.join(LOCALES)}")
    for locale in LOCALES:
        tags = value.get(locale)
        if not isinstance(tags, list) or not all(isinstance(tag, str) for tag in tags):
            raise ValueError(f"{label}.{locale} must be an array of strings")


def _validate_number(value, label):
    if not isinstance(value, (int, float)) or isinstance(value, bool) or not math.isfinite(value):
        raise ValueError(f"{label} must be a finite number")


def _validate_monitoring_points(payload):
    if not isinstance(payload, dict) or not isinstance(payload.get("points"), list):
        raise ValueError("monitoring_points must contain a points array")
    for index, point in enumerate(payload["points"]):
        if not isinstance(point, dict):
            raise ValueError(f"points[{index}] must be an object")
        if not isinstance(point.get("id"), str) or not point["id"].strip():
            raise ValueError(f"points[{index}].id must be a non-empty string")
        coords = point.get("coords")
        if not isinstance(coords, list) or len(coords) != 2:
            raise ValueError(f"points[{index}].coords must be a two-item array")
        _validate_number(coords[0], f"points[{index}].coords[0]")
        _validate_number(coords[1], f"points[{index}].coords[1]")
        _validate_localized_strings(point.get("name"), f"points[{index}].name")
        _validate_localized_strings(point.get("note"), f"points[{index}].note")


def _validate_dataset_content(payload):
    if not isinstance(payload, dict) or not isinstance(payload.get("datasets"), list):
        raise ValueError("dataset_content must contain a datasets array")
    for index, dataset in enumerate(payload["datasets"]):
        if not isinstance(dataset, dict):
            raise ValueError(f"datasets[{index}] must be an object")
        if not isinstance(dataset.get("id"), str) or not dataset["id"].strip():
            raise ValueError(f"datasets[{index}].id must be a non-empty string")
        _validate_localized_strings(dataset.get("title"), f"datasets[{index}].title")
        _validate_localized_strings(dataset.get("summary"), f"datasets[{index}].summary")
        _validate_localized_tags(dataset.get("tags"), f"datasets[{index}].tags")


def _validate_app_content(payload):
    if not isinstance(payload, dict):
        raise ValueError("app_content must be an object")
    required = {"dashboard": ("intro", "summary"), "datasets": ("intro",), "admin": ("overview", "notice")}
    for section, keys in required.items():
        if not isinstance(payload.get(section), dict):
            raise ValueError(f"app_content.{section} must be an object")
        for key in keys:
            _validate_localized_strings(payload[section].get(key), f"app_content.{section}.{key}")


def _validate_layer_catalog(payload):
    if not isinstance(payload, dict) or not isinstance(payload.get("layers"), list):
        raise ValueError("layer_catalog must contain a layers array")
    for index, layer in enumerate(payload["layers"]):
        if not isinstance(layer, dict):
            raise ValueError(f"layers[{index}] must be an object")
        if not isinstance(layer.get("id"), str) or not layer["id"].strip():
            raise ValueError(f"layers[{index}].id must be a non-empty string")
        if not isinstance(layer.get("kind"), str) or not layer["kind"].strip():
            raise ValueError(f"layers[{index}].kind must be a non-empty string")
        _validate_localized_strings(layer.get("title"), f"layers[{index}].title")
        _validate_localized_strings(layer.get("summary"), f"layers[{index}].summary")
        for field in ("defaultVisible", "showInLegend", "showInActiveLayers"):
            if field in layer and not isinstance(layer[field], bool):
                raise ValueError(f"layers[{index}].{field} must be a boolean")
        if "sortOrder" in layer:
            _validate_number(layer["sortOrder"], f"layers[{index}].sortOrder")
        if "legend" in layer:
            legend = layer["legend"]
            if not isinstance(legend, dict):
                raise ValueError(f"layers[{index}].legend must be an object")
            if "title" in legend:
                _validate_localized_strings(legend.get("title"), f"layers[{index}].legend.title")
            if "items" in legend:
                if not isinstance(legend["items"], list):
                    raise ValueError(f"layers[{index}].legend.items must be an array")
                for item_index, item in enumerate(legend["items"]):
                    if not isinstance(item, dict):
                        raise ValueError(f"layers[{index}].legend.items[{item_index}] must be an object")
                    if not isinstance(item.get("id"), str) or not item["id"].strip():
                        raise ValueError(f"layers[{index}].legend.items[{item_index}].id must be a non-empty string")
                    _validate_localized_strings(item.get("label"), f"layers[{index}].legend.items[{item_index}].label")


VALIDATORS = {
    "monitoring_points": _validate_monitoring_points,
    "dataset_content": _validate_dataset_content,
    "app_content": _validate_app_content,
    "layer_catalog": _validate_layer_catalog,
}


def _cleanup_sessions():
    now = time.time()
    expired_tokens = [token for token, session in SESSIONS.items() if session.get("expires_at", 0) <= now]
    for token in expired_tokens:
        SESSIONS.pop(token, None)


def _create_session():
    _cleanup_sessions()
    token = secrets.token_urlsafe(32)
    SESSIONS[token] = {"expires_at": time.time() + SESSION_TTL_SECONDS}
    return token


def _clear_session(token):
    if token:
        SESSIONS.pop(token, None)


def _build_session_cookie(token, max_age):
    cookie = SimpleCookie()
    cookie[SESSION_COOKIE_NAME] = token
    morsel = cookie[SESSION_COOKIE_NAME]
    morsel["httponly"] = True
    morsel["path"] = "/"
    morsel["samesite"] = "Lax"
    morsel["max-age"] = str(max_age)
    if max_age <= 0:
        morsel["expires"] = "Thu, 01 Jan 1970 00:00:00 GMT"
    return morsel.OutputString()


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _send_json(self, status_code, payload, extra_headers=None):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        for header_name, header_value in (extra_headers or []):
            self.send_header(header_name, header_value)
        self.end_headers()
        self.wfile.write(body)

    def _send_redirect(self, location):
        self.send_response(302)
        self.send_header("Location", location)
        self.end_headers()

    def _parse_request_cookies(self):
        cookie_header = self.headers.get("Cookie", "")
        cookie = SimpleCookie()
        if cookie_header:
            cookie.load(cookie_header)
        return cookie

    def _get_session_token(self):
        cookie = self._parse_request_cookies()
        morsel = cookie.get(SESSION_COOKIE_NAME)
        return morsel.value if morsel else ""

    def _is_admin_authenticated(self):
        _cleanup_sessions()
        token = self._get_session_token()
        session = SESSIONS.get(token)
        if not session:
            return False
        session["expires_at"] = time.time() + SESSION_TTL_SECONDS
        return True

    def _require_admin_auth(self):
        if self._is_admin_authenticated():
            return True
        self._send_json(401, {
            "ok": False,
            "error": "Admin login required.",
            "auth_required": True,
            "authenticated": False,
        })
        return False

    def _config_name_from_path(self, parsed_path):
        parts = [part for part in parsed_path.split("/") if part]
        if len(parts) != 3 or parts[0] != "api" or parts[1] != "config":
            return None
        return parts[2] if parts[2] in CONFIG_PATHS else None

    def _load_request_json(self):
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0:
            raise ValueError("Request body is required")
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode("utf-8-sig"))
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid JSON: {exc.msg}") from exc

    def _handle_auth_status(self):
        self._send_json(200, _json_ok(
            auth_required=True,
            authenticated=self._is_admin_authenticated(),
            password_source=ADMIN_PASSWORD_SOURCE,
            using_default_password=ADMIN_PASSWORD_SOURCE == "default",
            session_ttl_seconds=SESSION_TTL_SECONDS,
        ))

    def _handle_auth_login(self):
        try:
            payload = self._load_request_json()
        except ValueError as exc:
            self._send_json(400, _json_error(str(exc)))
            return
        password = payload.get("password", "")
        if not isinstance(password, str) or not hmac.compare_digest(password, ADMIN_PASSWORD):
            self._send_json(401, {
                "ok": False,
                "error": "Incorrect admin password.",
                "auth_required": True,
                "authenticated": False,
            })
            return
        token = _create_session()
        self._send_json(
            200,
            _json_ok(auth_required=True, authenticated=True, password_source=ADMIN_PASSWORD_SOURCE),
            extra_headers=[("Set-Cookie", _build_session_cookie(token, SESSION_TTL_SECONDS))],
        )

    def _handle_auth_logout(self):
        token = self._get_session_token()
        _clear_session(token)
        self._send_json(
            200,
            _json_ok(auth_required=True, authenticated=False),
            extra_headers=[("Set-Cookie", _build_session_cookie("", 0))],
        )

    def do_GET(self):
        parsed = urlparse(self.path)
        tif_prefix = None
        if parsed.path.startswith("/TIF/"):
            tif_prefix = "/TIF/"
        elif parsed.path.startswith("/vs/TIF/"):
            tif_prefix = "/vs/TIF/"

        if parsed.path in ("/login.html", "/login") and self._is_admin_authenticated():
            self._send_redirect("admin.html")
            return

        if parsed.path in ("/admin.html", "/admin") and not self._is_admin_authenticated():
            self._send_redirect("login.html?next=admin.html")
            return

        if parsed.path in ("/api/auth/status", "/api/admin/auth-status"):
            self._handle_auth_status()
            return

        if parsed.path == "/api/admin/health":
            if not self._require_admin_auth():
                return
            self._send_json(200, _json_ok(
                status="ok",
                config_dir=str(CONFIG_DIR),
                backup_dir=str(BACKUP_DIR),
                available_configs=sorted(CONFIG_PATHS.keys()),
                server_time=datetime.now().isoformat(timespec="seconds"),
                password_source=ADMIN_PASSWORD_SOURCE,
                using_default_password=ADMIN_PASSWORD_SOURCE == "default",
            ))
            return

        config_name = self._config_name_from_path(parsed.path)
        if config_name:
            try:
                payload = _read_json(CONFIG_PATHS[config_name])
            except FileNotFoundError:
                self._send_json(404, _json_error("Config file not found"))
                return
            except json.JSONDecodeError as exc:
                self._send_json(500, _json_error(f"Config JSON is invalid: {exc}"))
                return
            self._send_json(200, payload)
            return

        if tif_prefix:
            query = parsed.query.lower()
            wants_render = "render=1" in query
            is_png_request = parsed.path.lower().endswith(".png")
            if not (wants_render or is_png_request):
                super().do_GET()
                return
            name = unquote(parsed.path[len(tif_prefix):])
            if name.lower().endswith(".png"):
                name = name[:-4]
            tif_path = TIF_DIR / name
            if not tif_path.exists() and not name.lower().endswith(".tif"):
                tif_path = TIF_DIR / f"{name}.tif"
            if not tif_path.exists():
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b"Raster not found")
                return
            try:
                png_bytes = _render_raster(tif_path)
            except Exception as exc:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(f"Raster render failed: {exc}".encode("utf-8"))
                return
            self.send_response(200)
            self.send_header("Content-Type", "image/png")
            self.send_header("Content-Length", str(len(png_bytes)))
            self.end_headers()
            self.wfile.write(png_bytes)
            return

        if parsed.path in ("/raster/index.json", "/vs/raster/index.json"):
            entries = []
            for tif in sorted(TIF_DIR.glob("*.tif")):
                try:
                    with rasterio.open(tif) as dataset:
                        bounds = dataset.bounds
                    entries.append({"name": tif.name, "bounds": [bounds.bottom, bounds.left, bounds.top, bounds.right]})
                except Exception:
                    continue
            self._send_json(200, entries)
            return

        super().do_GET()

    def do_PUT(self):
        self._handle_config_write()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path in ("/api/auth/login", "/api/admin/login"):
            self._handle_auth_login()
            return
        if parsed.path == "/api/auth/logout":
            self._handle_auth_logout()
            return
        self._handle_config_write()

    def _handle_config_write(self):
        parsed = urlparse(self.path)
        config_name = self._config_name_from_path(parsed.path)
        if not config_name:
            self._send_json(404, _json_error("Unknown config endpoint"))
            return
        if not self._require_admin_auth():
            return
        try:
            payload = self._load_request_json()
            VALIDATORS[config_name](payload)
            backup_path = _backup_file(CONFIG_PATHS[config_name], config_name)
            _write_json(CONFIG_PATHS[config_name], payload)
        except ValueError as exc:
            self._send_json(400, _json_error(str(exc)))
            return
        except Exception as exc:
            self._send_json(500, _json_error(f"Failed to save config: {exc}"))
            return
        self._send_json(200, _json_ok(config=config_name, saved_path=str(CONFIG_PATHS[config_name]), backup_path=str(backup_path) if backup_path else None))


class ReusableTCPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


with ReusableTCPServer(("", PORT), Handler) as httpd:
    print(f"Serving {ROOT} on http://localhost:{PORT}")
    print(f"Admin login password source: {ADMIN_PASSWORD_SOURCE}")
    if ADMIN_PASSWORD_SOURCE == "default":
        print(f"Using default local admin password: {DEFAULT_ADMIN_PASSWORD}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
