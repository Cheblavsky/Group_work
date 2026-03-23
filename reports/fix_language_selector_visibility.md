# Language Selector Visibility Fix

## 1. Files modified

- `vs/style.css`
- `vs/app-common.js`

## 2. What visual issue was found

The shared header language selector used a very light transparent background and a faint border on top of a dark header. That made the selected value harder to read, reduced the visibility of the control edges, and left the hover and focus states too subtle. The native dropdown arrow also had weak contrast in some browser states, and the control width/padding was a little tight for language labels.

## 3. What exact UI changes were made

- Added a selector-specific class to the shared header `<select>` so the fix only targets the language control and does not affect admin form fields.
- Increased label contrast for the language switcher text.
- Gave the select a darker opaque background and brighter text color for stronger contrast against the header.
- Increased border visibility and added a subtle inset highlight so the control edge reads more clearly.
- Added extra right padding and a small custom caret using CSS backgrounds so the arrow remains visible on the dark surface.
- Added a clearer hover state by darkening the control slightly and tinting the border.
- Added a more obvious focus ring and stronger focus border for keyboard visibility.
- Set a minimum width so labels such as `English`, `Magyar`, `中文`, and `Kurdish` are less cramped.
- Styled dropdown `option` elements with a dark background and light text to improve menu readability where browser support allows it.
- Added a small `z-index` to the closed control to reduce the chance of it visually tucking under nearby header content.

## 4. Whether all pages using the shared header were affected correctly

Yes. The language selector is rendered through the shared header in `vs/app-common.js`, which is used by:

- dashboard page (`vs/index.html` via `vs/script.js`)
- datasets page (`vs/datasets.html` via `vs/datasets.js`)
- admin page (`vs/admin.html` via `vs/admin.js`)

Because the styling change targets the shared selector class, all pages using that shared header receive the same update consistently.

## 5. Any remaining manual browser checks

- Open dashboard, datasets, and admin pages and confirm the selector looks consistent in the header on each page.
- Verify hover and keyboard focus states are clearly visible.
- Open the dropdown and confirm the option list is readable in your browser on Windows.
- Switch between `English`, `中文`, `Magyar`, and `Kurdish` and confirm the selected value fits comfortably in the closed control.
- Check the Kurdish RTL state to ensure the selector still aligns and reads correctly in the header.
- Confirm the dropdown is not clipped or visually hidden behind nearby content at desktop and narrow/mobile widths.
