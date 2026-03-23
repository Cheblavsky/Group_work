# Config Guide

This project separates system UI labels from editable environmental content.

- `vs/i18n.js`: system UI labels, buttons, headings, status messages, and shared navigation text
- `vs/config/*.json`: editable domain content used by the dashboard, datasets page, and admin page

## monitoring_points.json
Purpose: stores the monitoring points shown on the dashboard map.

Top-level shape:
```json
{
  "points": [
    {
      "id": "wetland-monitor",
      "coords": [46.267, 20.112],
      "name": { "en": "...", "zh": "...", "hu": "...", "ku": "..." },
      "note": { "en": "...", "zh": "...", "hu": "...", "ku": "..." }
    }
  ]
}
```

Required fields:
- `points`: array
- `id`: stable string identifier
- `coords`: two numbers in `[lat, lng]` order
- `name`: localized object with `en/zh/hu/ku`
- `note`: localized object with `en/zh/hu/ku`

Used by:
- Dashboard map markers and popups
- Admin monitoring-points editor

Editable in admin:
- Yes

Still code-owned:
- Marker style, popup layout, and Leaflet rendering behavior

## dataset_content.json
Purpose: stores editable user-facing dataset copy.

Top-level shape:
```json
{
  "datasets": [
    {
      "id": "esa-worldcover",
      "title": { "en": "...", "zh": "...", "hu": "...", "ku": "..." },
      "summary": { "en": "...", "zh": "...", "hu": "...", "ku": "..." },
      "tags": {
        "en": ["Raster", "Land cover"],
        "zh": ["栅格", "土地覆盖"],
        "hu": ["Raster", "Felszinboritas"],
        "ku": ["ڕاستەر", "داپۆشینی زەوی"]
      }
    }
  ]
}
```

Required fields:
- `datasets`: array
- `id`: stable dataset identifier
- `title`: localized object with `en/zh/hu/ku`
- `summary`: localized object with `en/zh/hu/ku`
- `tags`: localized arrays with `en/zh/hu/ku`

Used by:
- Datasets page cards
- Dashboard fallback display helpers
- Admin dataset-text editor

Editable in admin:
- Yes

Still code-owned:
- Markdown parsing
- Dataset technical metadata such as file name, min/max values, and spatial bounds

## app_content.json
Purpose: stores localized page-level explanatory copy.

Top-level shape:
```json
{
  "dashboard": {
    "intro": { "en": "...", "zh": "...", "hu": "...", "ku": "..." },
    "summary": { "en": "...", "zh": "...", "hu": "...", "ku": "..." }
  },
  "datasets": {
    "intro": { "en": "...", "zh": "...", "hu": "...", "ku": "..." }
  },
  "admin": {
    "overview": { "en": "...", "zh": "...", "hu": "...", "ku": "..." },
    "notice": { "en": "...", "zh": "...", "hu": "...", "ku": "..." }
  }
}
```

Required sections:
- `dashboard`
- `datasets`
- `admin`

Used by:
- Dashboard intro/summary copy
- Datasets page intro copy
- Admin overview and notice content

Editable in admin:
- Yes

Still code-owned:
- Page layout and component placement

## layer_catalog.json
Purpose: stores user-facing layer catalog content and lightweight display behavior for the dashboard.

Top-level shape:
```json
{
  "layers": [
    {
      "id": "esa-worldcover",
      "kind": "raster",
      "title": { "en": "...", "zh": "...", "hu": "...", "ku": "..." },
      "summary": { "en": "...", "zh": "...", "hu": "...", "ku": "..." },
      "defaultVisible": true,
      "showInLegend": true,
      "showInActiveLayers": true,
      "sortOrder": 10,
      "legend": {
        "title": { "en": "...", "zh": "...", "hu": "...", "ku": "..." },
        "items": [
          {
            "id": "tree",
            "label": { "en": "...", "zh": "...", "hu": "...", "ku": "..." }
          }
        ]
      }
    }
  ]
}
```

Required fields:
- `layers`: array
- `id`: stable layer identifier
- `kind`: layer kind such as `raster`, `vector`, or `points`
- `title`: localized object with `en/zh/hu/ku`
- `summary`: localized object with `en/zh/hu/ku`

Optional fields:
- `defaultVisible`
- `showInLegend`
- `showInActiveLayers`
- `sortOrder`
- `legend.title`
- `legend.items[].label`

Used by:
- Dashboard layer names and summaries
- Dashboard active-layer list
- Dashboard legend headings/labels where configured
- Dashboard compact available-layer catalog
- Admin layer-catalog editor

Editable in admin:
- Yes

Still code-owned:
- Raster rendering algorithms
- Color ramps and image-overlay fallback behavior
- Base map URLs
- Shapefile and marker drawing implementation

## Fallback behavior
If a config request fails on the frontend:
- the app logs a console warning
- a bundled default config is used
- the page remains usable instead of crashing
- some pages show a small non-blocking warning banner

If a config save fails on the backend:
- the server returns a JSON error response
- the admin UI shows an error status instead of a fake success message
- the previous config file remains in place

## Backups
Before overwriting a config file, `vs/server.py` creates a timestamped backup in `vs/backups/`.

## Summary: editable vs code-owned
Editable through admin:
- Monitoring point ids, coordinates, names, and notes
- Dataset titles, summaries, and tags
- Dashboard/datasets/admin explanatory copy
- Layer titles, summaries, legend text, and lightweight visibility flags

Still code-owned:
- Leaflet map setup
- Basemap definitions
- Raster rendering logic
- Shapefile loading logic
- Static file serving and API implementation in `server.py`
