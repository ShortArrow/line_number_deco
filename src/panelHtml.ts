/** One color setting as the panel shows it: the saved value beside a picker. */
export interface PanelRow {
  key: string;
  label: string;
  savedColor: string;
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

function renderRow(row: PanelRow) {
  const key = escapeHtml(row.key);
  const saved = escapeHtml(row.savedColor);
  return `      <div class="row">
        <div class="label">${escapeHtml(row.label)}</div>
        <div class="controls">
          <span class="swatch" data-swatch="${key}" style="background:${saved}" title="${saved}"></span>
          <input type="color" data-key="${key}" value="${escapeHtml(pickerValue(row.savedColor))}" />
          <button data-apply="${key}">Apply</button>
        </div>
      </div>`;
}

const script = `      const vscode = acquireVsCodeApi();
      function scope() {
        const checked = document.querySelector('input[name="scope"]:checked');
        return checked ? checked.value : 'workspace';
      }
      document.querySelectorAll('input[type="color"]').forEach((input) => {
        input.addEventListener('input', () => {
          vscode.postMessage({ type: 'preview', key: input.dataset.key, value: input.value });
        });
      });
      document.querySelectorAll('button[data-apply]').forEach((button) => {
        button.addEventListener('click', () => {
          const key = button.dataset.apply;
          const input = document.querySelector('input[type="color"][data-key="' + key + '"]');
          vscode.postMessage({ type: 'apply', key: key, value: input.value, scope: scope() });
        });
      });
      window.addEventListener('message', (event) => {
        const message = event.data;
        if (!message || message.type !== 'state') {
          return;
        }
        message.rows.forEach((row) => {
          const swatch = document.querySelector('[data-swatch="' + row.key + '"]');
          if (swatch) {
            swatch.style.background = row.savedColor;
            swatch.title = row.savedColor;
          }
          const input = document.querySelector('input[type="color"][data-key="' + row.key + '"]');
          if (input && /^#[0-9a-fA-F]{6}$/.test(row.savedColor)) {
            input.value = row.savedColor;
          }
        });
      });`;

const style = `      body { font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); padding: 8px; }
      .scope { display: flex; gap: 12px; margin-bottom: 12px; }
      .scope label { display: flex; align-items: center; gap: 4px; }
      .row { margin-bottom: 10px; }
      .label { margin-bottom: 4px; }
      .controls { display: flex; align-items: center; gap: 6px; }
      .swatch { width: 18px; height: 18px; border: 1px solid var(--vscode-panel-border); display: inline-block; }
      input[type="color"] { width: 40px; height: 22px; padding: 0; border: none; background: none; }
      button { color: var(--vscode-button-foreground); background: var(--vscode-button-background); border: none; padding: 2px 8px; cursor: pointer; }
      button:hover { background: var(--vscode-button-hoverBackground); }`;

/**
 * Build the whole panel document.
 *
 * Every interpolated value is escaped, the policy allows nothing but the script
 * carrying this nonce, and each row keeps its configuration key in a data
 * attribute so the messages back to the extension need no other lookup table.
 */
export function renderPanelHtml(
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
${style}
    </style>
  </head>
  <body>
    <div class="scope">
      <label><input type="radio" name="scope" value="workspace" checked /> Workspace</label>
      <label><input type="radio" name="scope" value="user" /> User</label>
    </div>
${rows.map(renderRow).join("\n")}
    <script nonce="${safeNonce}">
${script}
    </script>
  </body>
</html>`;
}
