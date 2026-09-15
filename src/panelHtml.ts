import { panelCss, panelScript } from "./generated/webviewAssets";
import { ScopeName, ScopedDisplay, ScopeValues, displayForScope } from "./panelState";

/**
 * One color setting as the panel shows it: what each scope holds, beside a
 * picker.
 *
 * The whole triple travels rather than one value, because which of the three
 * a row displays is the radio's to decide, and the radio can flip without the
 * extension being asked again.
 */
export interface PanelRow {
  key: string;
  label: string;
  values: ScopeValues<string>;
}

/**
 * One enumerated setting as the panel shows it: what each scope holds beside
 * the whole set it may take.
 */
export interface PanelSelect {
  key: string;
  label: string;
  values: ScopeValues<string>;
  options: string[];
}

/** One boolean mode as the panel shows it: a switch and what each scope holds. */
export interface PanelToggle {
  key: string;
  label: string;
  values: ScopeValues<boolean>;
}

/** The scope a freshly opened panel shows, matching the checked radio. */
const initialScope: ScopeName = "workspace";

/** The words a row uses to name where its value is written. */
const sourceLabels: { [source: string]: string } = {
  workspace: "from workspace",
  user: "from user",
  default: "from default",
  none: "not set",
};

/**
 * The marks a row carries so the reader and the script agree on what it shows.
 *
 * The source is an attribute rather than a class because the script rewrites it
 * on every radio flip, and a row whose value is written somewhere other than
 * the selected scope is dimmed: it is showing what it would inherit, not what
 * that scope holds.
 */
function scopeMarks<T extends string | boolean>(
  display: ScopedDisplay<T>,
  scope: ScopeName
): { classes: string; attribute: string; tag: string } {
  const inherited = display.source !== scope;
  return {
    classes: inherited ? " inherited" : "",
    attribute: ` data-source="${display.source}"`,
    tag: `<span class="source" data-source-tag="true">${sourceLabels[display.source]}</span>`,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const colorPattern = /^#[0-9a-fA-F]{6}$/;

/** A picker needs a well-formed value; anything else falls back to black. */
function pickerValue(savedColor: string) {
  return colorPattern.test(savedColor) ? savedColor : "#000000";
}

function renderToggle(toggle: PanelToggle) {
  const key = escapeHtml(toggle.key);
  const display = displayForScope(initialScope, toggle.key, toggle.values, {});
  const marks = scopeMarks(display, initialScope);
  return `      <div class="row toggle-row${marks.classes}" data-row="${key}"${marks.attribute}>
        <label class="toggle">
          <span class="label">${escapeHtml(toggle.label)}${marks.tag}</span>
          <span class="switch">
            <input type="checkbox" data-toggle="${key}"${display.value === true ? " checked" : ""} />
            <span class="slider"></span>
          </span>
        </label>
        <button data-apply-toggle="${key}">Apply</button>
      </div>`;
}

/** One range input, carrying the row it edits and which component it moves. */
function renderSlider(key: string, component: string, max: number) {
  return `            <label class="slider-line" data-slider-line="${component}"><span class="slider-name">${component.toUpperCase()}</span><input type="range" min="0" max="${max}" data-slider-for="${key}" data-slider="${component}" /><span class="slider-readout" data-readout-for="${key}" data-readout="${component}"></span></label>`;
}

/**
 * The saturation and value surface of a row, with the marker that reads it.
 *
 * The gradients are painted in css and only the hue underneath is set from
 * script, so dragging the marker repaints nothing but one background color.
 */
function renderPlane(key: string) {
  return `          <div class="plane" data-plane-for="${key}">
            <div class="plane-marker" data-plane-marker="${key}"></div>
          </div>`;
}

/**
 * The two slider triples of a row, folded away until the reader asks for them.
 *
 * The plane comes first because it is the coarse control: the sliders and the
 * mode tabs below it are for correcting one component once the color is close.
 * Both slider models stay in the document and the mode tabs only choose which
 * one is shown, so a value typed into either is already converted when it
 * reappears.
 */
function renderSliders(key: string) {
  return `        <details class="editor">
          <summary>Sliders</summary>
${renderPlane(key)}
          <div class="modes">
            <button class="mode active" data-mode-tab="hsl" data-mode-for="${key}">HSL</button>
            <button class="mode" data-mode-tab="rgb" data-mode-for="${key}">RGB</button>
          </div>
          <div class="sliders" data-mode-panel="hsl" data-mode-for="${key}">
${renderSlider(key, "h", 360)}
${renderSlider(key, "s", 100)}
${renderSlider(key, "l", 100)}
          </div>
          <div class="sliders hidden" data-mode-panel="rgb" data-mode-for="${key}">
${renderSlider(key, "r", 255)}
${renderSlider(key, "g", 255)}
${renderSlider(key, "b", 255)}
          </div>
        </details>`;
}

/**
 * The discard arrow, drawn rather than loaded.
 *
 * A codicon would mean a font file and a second source rule in the policy, so
 * the one glyph the panel needs is a path: a ring open at the top left with an
 * arrowhead turning back counter-clockwise onto it.
 */
const discardGlyph =
  '<svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" focusable="false">' +
  '<path fill="currentColor" d="M8 3a5 5 0 1 1-4.546 2.914l1.09.502A3.8 3.8 0 1 0 8 4.2V3z"/>' +
  '<path fill="currentColor" d="M8.75 1.4v3.2L5.6 3z"/>' +
  "</svg>";

/**
 * One enumerated setting as a segmented control.
 *
 * The row carries the same Apply and Reset controls as a color row, so it
 * commits and discards through the paths every other row already uses. Which
 * option is in force is an attribute rather than a class, so the script and the
 * tests read the same mark.
 */
function renderSelect(select: PanelSelect) {
  const key = escapeHtml(select.key);
  const display = displayForScope(initialScope, select.key, select.values, {});
  const marks = scopeMarks(display, initialScope);
  const options = select.options
    .map((option) => {
      const value = escapeHtml(option);
      const current = option === display.value ? ' data-current="true"' : "";
      return `            <button class="segment" data-select-for="${key}" data-value="${value}"${current}>${value}</button>`;
    })
    .join("\n");
  return `      <div class="row select-row${marks.classes}" data-row="${key}"${marks.attribute}>
        <div class="label">${escapeHtml(select.label)}${marks.tag}</div>
        <div class="controls">
          <div class="segmented" role="group" aria-label="${escapeHtml(select.label)}">
${options}
          </div>
          <button data-apply="${key}">Apply</button>
          <button class="icon" title="Reset" aria-label="Reset" data-reset="${key}">${discardGlyph}</button>
        </div>
      </div>`;
}

function renderRow(row: PanelRow) {
  const key = escapeHtml(row.key);
  const display = displayForScope(initialScope, row.key, row.values, {});
  const marks = scopeMarks(display, initialScope);
  // A setting written nowhere shows an empty field over the neutral swatch,
  // exactly as an empty saved color always has: there is no color to show.
  const shown = display.value ?? "";
  const saved = escapeHtml(shown);
  return `      <div class="row${marks.classes}" data-row="${key}"${marks.attribute}>
        <div class="label">${escapeHtml(row.label)}${marks.tag}</div>
        <div class="controls">
          <span class="swatch" data-swatch="${key}" style="background:${saved}" title="${saved}"></span>
          <input type="color" data-key="${key}" value="${escapeHtml(pickerValue(shown))}" />
          <input type="text" class="hex" spellcheck="false" data-hex-for="${key}" value="${saved}" />
          <button data-apply="${key}">Apply</button>
          <button class="icon" title="Reset" aria-label="Reset" data-reset="${key}">${discardGlyph}</button>
        </div>
${renderSliders(key)}
      </div>`;
}


/**
 * Build the whole panel document.
 *
 * Every interpolated value is escaped, the policy allows nothing but the script
 * carrying this nonce, and each toggle and row keeps its configuration key in a
 * data attribute so the messages back to the extension need no other lookup
 * table. The switches come first: they decide whether a color is drawn at all.
 *
 * Flipping a switch or dragging a picker only previews; a row marks itself
 * pending until a state message says its value was saved. The footer button
 * commits every pending row at once. A state message names what is saved and
 * what is staged separately, and every control shows the staged value over the
 * saved one, so a resync arriving mid-edit cannot undo a choice.
 *
 * The radio at the top picks the scope a row displays as well as the one Apply
 * writes to. Each row is given what all three scopes hold, so flipping it is
 * local; a row showing a value written elsewhere is dimmed and names its
 * source, because otherwise a user-level value would stay invisible behind
 * whatever the workspace holds.
 *
 * The select rows sit between the two: they are settings of the editor rather
 * than of this extension, and choosing one stages it without any local
 * rendering, because VS Code draws those numbers itself.
 *
 * The script and the stylesheet are bundled at build time from src/webview, so
 * nothing is read off disk here and the conversions the sliders run are the
 * very ones the unit tests cover.
 */
export function renderPanelHtml(
  toggles: PanelToggle[],
  selects: PanelSelect[],
  rows: PanelRow[],
  nonce: string,
  cspSource: string
): string {
  const safeNonce = escapeHtml(nonce);
  const safeCspSource = escapeHtml(cspSource);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${safeCspSource} 'unsafe-inline'; script-src 'nonce-${safeNonce}';" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
${panelCss}
    </style>
  </head>
  <body>
    <div class="scope">
      <label><input type="radio" name="scope" value="workspace" checked /> Workspace</label>
      <label><input type="radio" name="scope" value="user" /> User</label>
    </div>
    <div class="section">
      <h2>Decorations</h2>
${toggles.map(renderToggle).join("\n")}
    </div>
    <div class="section">
      <h2>Editor</h2>
${selects.map(renderSelect).join("\n")}
    </div>
    <div class="section">
      <h2>Colors</h2>
${rows.map(renderRow).join("\n")}
    </div>
    <div class="footer">
      <button data-apply-all="1">Apply all</button>
      <button data-reset-all="1">Reset all</button>
    </div>
    <script nonce="${safeNonce}">
${panelScript}
    </script>
  </body>
</html>`;
}
