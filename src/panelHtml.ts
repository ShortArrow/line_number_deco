/** One color setting as the panel shows it: the saved value beside a picker. */
export interface PanelRow {
  key: string;
  label: string;
  savedColor: string;
}

/** One boolean mode as the panel shows it: a switch carrying its saved state. */
export interface PanelToggle {
  key: string;
  label: string;
  value: boolean;
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
  return `      <div class="row toggle-row" data-row="${key}">
        <label class="toggle">
          <span class="label">${escapeHtml(toggle.label)}</span>
          <span class="switch">
            <input type="checkbox" data-toggle="${key}"${toggle.value ? " checked" : ""} />
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
 * The two slider triples of a row, folded away until the reader asks for them.
 *
 * Both models stay in the document and the mode tabs only choose which one is
 * shown, so a value typed into either is already converted when it reappears.
 */
function renderSliders(key: string) {
  return `        <details class="editor">
          <summary>Sliders</summary>
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

function renderRow(row: PanelRow) {
  const key = escapeHtml(row.key);
  const saved = escapeHtml(row.savedColor);
  return `      <div class="row" data-row="${key}">
        <div class="label">${escapeHtml(row.label)}</div>
        <div class="controls">
          <span class="swatch" data-swatch="${key}" style="background:${saved}" title="${saved}"></span>
          <input type="color" data-key="${key}" value="${escapeHtml(pickerValue(row.savedColor))}" />
          <button data-apply="${key}">Apply</button>
        </div>
${renderSliders(key)}
      </div>`;
}

const script = `      const vscode = acquireVsCodeApi();
      function scope() {
        const checked = document.querySelector('input[name="scope"]:checked');
        return checked ? checked.value : 'workspace';
      }
      function markPending(key, pending) {
        const row = document.querySelector('[data-row="' + key + '"]');
        if (row) {
          row.classList.toggle('pending', pending);
        }
      }
      document.querySelectorAll('input[type="checkbox"][data-toggle]').forEach((input) => {
        input.addEventListener('change', () => {
          markPending(input.dataset.toggle, true);
          vscode.postMessage({
            type: 'previewToggle',
            key: input.dataset.toggle,
            value: input.checked,
          });
        });
      });
      /**
       * One inlined conversion by source and target, or undefined when the
       * library could not be read.
       *
       * The names are assembled rather than written out so the panel script
       * never spells one: their presence in the document is what proves the
       * library was really inlined.
       */
      function convert(from, to) {
        return exports[from + 'To' + to.charAt(0).toUpperCase() + to.slice(1)];
      }
      function sliders(key) {
        return document.querySelectorAll('input[data-slider-for="' + key + '"]');
      }
      function readSliders(key, mode) {
        const value = {};
        sliders(key).forEach((slider) => {
          value[slider.dataset.slider] = Number(slider.value);
        });
        return mode === 'rgb'
          ? { r: value.r, g: value.g, b: value.b }
          : { h: value.h, s: value.s, l: value.l };
      }
      function activeMode(key) {
        const tab = document.querySelector('[data-mode-tab].active[data-mode-for="' + key + '"]');
        return tab ? tab.dataset.modeTab : 'hsl';
      }
      /** Push one hex into both slider triples, so switching mode shows the same color. */
      function showOnSliders(key, hex) {
        if (!convert('hex', 'rgb')) {
          return;
        }
        const rgb = convert('hex', 'rgb')(hex);
        const hsl = convert('hex', 'hsl')(hex);
        if (!rgb || !hsl) {
          return;
        }
        const parts = { h: hsl.h, s: hsl.s, l: hsl.l, r: rgb.r, g: rgb.g, b: rgb.b };
        sliders(key).forEach((slider) => {
          slider.value = parts[slider.dataset.slider];
        });
        document
          .querySelectorAll('[data-readout-for="' + key + '"]')
          .forEach((readout) => {
            readout.textContent = parts[readout.dataset.readout];
          });
        paintSliders(key, hsl);
      }
      /** Repaint the saturation and lightness tracks against the current hue. */
      function paintSliders(key, hsl) {
        const s = document.querySelector('input[data-slider-for="' + key + '"][data-slider="s"]');
        const l = document.querySelector('input[data-slider-for="' + key + '"][data-slider="l"]');
        if (s) {
          s.style.background =
            'linear-gradient(to right, ' +
            convert('hsl', 'hex')({ h: hsl.h, s: 0, l: hsl.l }) +
            ', ' +
            convert('hsl', 'hex')({ h: hsl.h, s: 100, l: hsl.l }) +
            ')';
        }
        if (l) {
          l.style.background =
            'linear-gradient(to right, #000000, ' +
            convert('hsl', 'hex')({ h: hsl.h, s: hsl.s, l: 50 }) +
            ', #ffffff)';
        }
      }
      function showEverywhere(key, hex) {
        const input = document.querySelector('input[type="color"][data-key="' + key + '"]');
        if (input) {
          input.value = hex;
        }
        const swatch = document.querySelector('[data-swatch="' + key + '"]');
        if (swatch) {
          swatch.style.background = hex;
          swatch.title = hex;
        }
        showOnSliders(key, hex);
      }
      document.querySelectorAll('input[type="color"]').forEach((input) => {
        input.addEventListener('input', () => {
          markPending(input.dataset.key, true);
          showOnSliders(input.dataset.key, input.value);
          vscode.postMessage({ type: 'preview', key: input.dataset.key, value: input.value });
        });
      });
      document.querySelectorAll('input[type="range"][data-slider-for]').forEach((slider) => {
        slider.addEventListener('input', () => {
          const key = slider.dataset.sliderFor;
          const mode = activeMode(key);
          if (!convert('rgb', 'hex')) {
            return;
          }
          const parts = readSliders(key, mode);
          const hex = convert(mode === 'rgb' ? 'rgb' : 'hsl', 'hex')(parts);
          markPending(key, true);
          showEverywhere(key, hex);
          vscode.postMessage({ type: 'preview', key: key, value: hex });
        });
      });
      document.querySelectorAll('[data-mode-tab]').forEach((tab) => {
        tab.addEventListener('click', () => {
          const key = tab.dataset.modeFor;
          const mode = tab.dataset.modeTab;
          document
            .querySelectorAll('[data-mode-tab][data-mode-for="' + key + '"]')
            .forEach((other) => {
              other.classList.toggle('active', other === tab);
            });
          document
            .querySelectorAll('[data-mode-panel][data-mode-for="' + key + '"]')
            .forEach((panel) => {
              panel.classList.toggle('hidden', panel.dataset.modePanel !== mode);
            });
        });
      });
      document.querySelectorAll('button[data-apply]').forEach((button) => {
        button.addEventListener('click', () => {
          const key = button.dataset.apply;
          const input = document.querySelector('input[type="color"][data-key="' + key + '"]');
          vscode.postMessage({ type: 'apply', key: key, value: input.value, scope: scope() });
        });
      });
      document.querySelectorAll('button[data-apply-toggle]').forEach((button) => {
        button.addEventListener('click', () => {
          const key = button.dataset.applyToggle;
          const box = document.querySelector('input[data-toggle="' + key + '"]');
          vscode.postMessage({
            type: 'applyToggle',
            key: key,
            value: box.checked,
            scope: scope(),
          });
        });
      });
      document.querySelectorAll('button[data-apply-all]').forEach((button) => {
        button.addEventListener('click', () => {
          vscode.postMessage({ type: 'applyAll', scope: scope() });
        });
      });
      window.addEventListener('message', (event) => {
        const message = event.data;
        if (!message || message.type !== 'state') {
          return;
        }
        (message.toggles || []).forEach((toggle) => {
          const box = document.querySelector('input[data-toggle="' + toggle.key + '"]');
          if (box) {
            box.checked = toggle.value;
          }
          markPending(toggle.key, false);
        });
        message.rows.forEach((row) => {
          markPending(row.key, false);
          const swatch = document.querySelector('[data-swatch="' + row.key + '"]');
          if (swatch) {
            swatch.style.background = row.savedColor;
            swatch.title = row.savedColor;
          }
          const input = document.querySelector('input[type="color"][data-key="' + row.key + '"]');
          if (input && /^#[0-9a-fA-F]{6}$/.test(row.savedColor)) {
            input.value = row.savedColor;
          }
          showOnSliders(row.key, /^#[0-9a-fA-F]{6}$/.test(row.savedColor) ? row.savedColor : '#000000');
        });
      });
      document.querySelectorAll('input[type="color"][data-key]').forEach((input) => {
        showOnSliders(input.dataset.key, input.value);
      });`;

const style = `      body { font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); padding: 8px; }
      .scope { display: flex; gap: 12px; margin-bottom: 12px; }
      .scope label { display: flex; align-items: center; gap: 4px; }
      .row { margin-bottom: 10px; }
      .row.pending .label::after { content: " ●"; color: var(--vscode-charts-orange, var(--vscode-button-background)); }
      .footer { border-top: 1px solid var(--vscode-panel-border); padding-top: 10px; }
      .toggle-row { display: flex; align-items: center; gap: 8px; }
      .toggle-row .toggle { flex: 1; margin-bottom: 0; }
      .label { margin-bottom: 4px; }
      .controls { display: flex; align-items: center; gap: 6px; }
      .swatch { width: 18px; height: 18px; border: 1px solid var(--vscode-panel-border); display: inline-block; }
      input[type="color"] { width: 40px; height: 22px; padding: 0; border: none; background: none; }
      button { color: var(--vscode-button-foreground); background: var(--vscode-button-background); border: none; padding: 2px 8px; cursor: pointer; }
      button:hover { background: var(--vscode-button-hoverBackground); }
      h2 { font-size: var(--vscode-font-size); text-transform: uppercase; opacity: 0.7; margin: 0 0 8px; }
      .section { margin-bottom: 16px; }
      .toggle { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; cursor: pointer; }
      .switch { position: relative; flex: none; width: 32px; height: 18px; }
      .switch input { position: absolute; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
      .slider { position: absolute; inset: 0; border-radius: 9px; background: var(--vscode-panel-border); transition: background 0.1s; pointer-events: none; }
      .slider::before { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: var(--vscode-button-foreground); transition: transform 0.1s; }
      .switch input:checked + .slider { background: var(--vscode-button-background); }
      .switch input:checked + .slider::before { transform: translateX(14px); }
      .switch input:focus-visible + .slider { outline: 1px solid var(--vscode-focusBorder); }
      .editor { margin-top: 6px; }
      .editor summary { cursor: pointer; opacity: 0.7; font-size: 0.9em; }
      .modes { display: flex; gap: 4px; margin: 6px 0; }
      .mode { opacity: 0.5; padding: 1px 8px; }
      .mode.active { opacity: 1; }
      .sliders.hidden { display: none; }
      .slider-line { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
      .slider-name { width: 14px; opacity: 0.7; font-size: 0.9em; }
      .slider-readout { width: 30px; text-align: right; opacity: 0.7; font-size: 0.9em; }
      input[type="range"] { flex: 1; height: 10px; appearance: none; -webkit-appearance: none; border-radius: 5px; background: var(--vscode-panel-border); }
      input[type="range"]::-webkit-slider-thumb { appearance: none; -webkit-appearance: none; width: 10px; height: 14px; border-radius: 2px; background: var(--vscode-button-foreground); border: 1px solid var(--vscode-panel-border); cursor: pointer; }
      input[type="range"][data-slider="h"] { background: linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000); }
      input[type="range"][data-slider="r"] { background: linear-gradient(to right, #000000, #ff0000); }
      input[type="range"][data-slider="g"] { background: linear-gradient(to right, #000000, #00ff00); }
      input[type="range"][data-slider="b"] { background: linear-gradient(to right, #000000, #0000ff); }`;

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
 * commits every pending row at once.
 *
 * @param inlineLib compiled color conversions, pasted verbatim into the nonced
 *   script behind an exports shim so the sliders convert with the very code the
 *   unit tests cover; an empty string leaves the row usable through its picker
 */
export function renderPanelHtml(
  toggles: PanelToggle[],
  rows: PanelRow[],
  nonce: string,
  cspSource: string,
  inlineLib: string
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
${style}
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
      <h2>Colors</h2>
${rows.map(renderRow).join("\n")}
    </div>
    <div class="footer">
      <button data-apply-all="1">Apply all</button>
    </div>
    <script nonce="${safeNonce}">
      const exports = {};
${inlineLib}
${script}
    </script>
  </body>
</html>`;
}
