# Manual QA Checklist

Use this checklist in a browser after starting `vs/server.py` locally.

## Setup
1. Start the server from the project root.
2. Open `http://127.0.0.1:8000/vs/index.html` or the alternate port you configured.
3. Keep the browser console open so you can spot non-blocking warnings.

## Dashboard load
- [ ] `index.html` opens without a blank page or fatal console errors.
- [ ] The shared header appears with Dashboard, Datasets, Admin, and the language selector.
- [ ] The Leaflet map loads and centers on the study area.
- [ ] The left panel stays compact and map-focused.
- [ ] The right legend panel renders without layout breakage.

Expected result:
- The page is usable immediately and remains map-first.

## Datasets page load
- [ ] Click the Datasets nav link.
- [ ] `datasets.html` loads with the shared header and language selector.
- [ ] Dataset cards appear with localized title, summary, tags, source file, and metadata source.
- [ ] No card layout overlaps or overflows badly on a normal desktop viewport.

Expected result:
- Dataset content renders correctly and the dashboard stays free of the full catalog list.

## Admin page load
- [ ] Click the Admin nav link.
- [ ] `admin.html` loads with the shared header and language selector.
- [ ] The Overview, Monitoring Points, Dataset Text Content, Dashboard / Page Content, and Layer Catalog sections all appear.
- [ ] The server health cards render.

Expected result:
- The admin page is readable and clearly acts as a local-development admin tool.

## Language switching on all pages
For each language `en`, `zh`, `hu`, and `ku`:
- [ ] Switch language from the shared header on Dashboard.
- [ ] Confirm header/nav labels update.
- [ ] Confirm dashboard panel labels, legend headings, and active-layer empty-state text update.
- [ ] Switch to Datasets and confirm page labels and dataset UI fields update.
- [ ] Switch to Admin and confirm section titles, field labels, and buttons update.
- [ ] Refresh the page and confirm the chosen language persists.

Expected result:
- System UI changes language consistently across all three pages.

## Monitoring points
- [ ] On Dashboard, confirm monitoring points still render.
- [ ] Toggle the monitoring-points overlay from the Leaflet layer control if available.
- [ ] Click at least one monitoring point.
- [ ] Confirm the popup uses the active language for the point name and note.

Expected result:
- Points still render correctly and localized popup content is shown.

## Dataset localization rendering
- [ ] Open Datasets page in each language.
- [ ] Confirm dataset title, summary, and tags come from config and change with language.
- [ ] Confirm technical metadata such as source file and metadata source still render.

Expected result:
- Human-facing text is localized while technical metadata remains available.

## Layer catalog rendering on dashboard
- [ ] Open Dashboard.
- [ ] Confirm the compact available-layer list appears in the left panel.
- [ ] Verify titles and summaries in that list follow the active language.
- [ ] Confirm the active-layer list uses config-driven layer titles.

Expected result:
- Layer-facing content is localized and no longer mostly hardcoded.

## Layer catalog admin edit flow
1. Open Admin.
2. In Layer Catalog, select a layer.
3. Change one localized title or summary.
4. Optionally toggle `defaultVisible`, `showInLegend`, or `showInActiveLayers`.
5. Save.
6. Reload Dashboard.

Checks:
- [ ] A real success status appears only after the save returns successfully.
- [ ] The edited title or summary appears on Dashboard.
- [ ] If visibility flags changed, the legend/active-layer behavior updates accordingly.

Expected result:
- Layer-catalog edits persist through the API and are visible on Dashboard.

## Legend visibility toggles
- [ ] In Admin, set one layer `showInLegend` to `false` and save.
- [ ] Reload Dashboard.
- [ ] Activate that layer on the map.
- [ ] Confirm it no longer appears in the legend panel.
- [ ] Restore the value after testing.

Expected result:
- Legend inclusion follows `layer_catalog.json`.

## Active-layer toggles
- [ ] In Admin, set one layer `showInActiveLayers` to `false` and save.
- [ ] Reload Dashboard.
- [ ] Activate that layer.
- [ ] Confirm it does not appear in the active-layer summary list.
- [ ] Restore the value after testing.

Expected result:
- Active-layer summary follows `layer_catalog.json`.

## Config save success and error behavior
Success checks:
- [ ] Edit and save Monitoring Points.
- [ ] Edit and save Dataset Text Content.
- [ ] Edit and save Dashboard / Page Content.
- [ ] Edit and save Layer Catalog.
- [ ] Confirm each section shows a success state only after a real API response.

Error checks:
- [ ] Stop the server or temporarily break the request path in DevTools.
- [ ] Try saving from Admin.
- [ ] Confirm an error message appears instead of a fake success state.

Expected result:
- Success and error messages match real save outcomes.

## Backup creation after save
- [ ] Save any config from Admin.
- [ ] Open `vs/backups/` in the file explorer or terminal.
- [ ] Confirm a new timestamped backup file was created.

Expected result:
- Every successful overwrite creates a backup.

## Fallback behavior if config endpoint fails
Suggested simulation:
1. Stop the Python server after the frontend is open.
2. Refresh a page.

Checks:
- [ ] Dashboard still shows fallback content or non-blocking warnings instead of crashing.
- [ ] Datasets page still renders fallback content if possible.
- [ ] Console warnings are present but not overwhelming.

Expected result:
- The app degrades gracefully when config endpoints fail.

## Small-screen usability
Use browser responsive mode.
- [ ] Check Dashboard around 390px width.
- [ ] Check Datasets page around 390px width.
- [ ] Check Admin page around 390px width.
- [ ] Confirm forms stack reasonably and remain usable.
- [ ] Confirm no major controls become unreachable.

Expected result:
- The app remains usable on a small screen even though it is desktop-first.

## Final result log
Record these before submission:
- Date tested:
- Browser(s) tested:
- Port used:
- Languages checked:
- Save flows checked:
- Any remaining UI issues:
