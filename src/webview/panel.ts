/**
 * The script the settings webview runs.
 *
 * It is bundled at build time rather than pasted together at runtime, so the
 * hex rule and the pending merge arrive as ordinary imports: a name that does
 * not exist fails the build instead of leaving a control inert.
 *
 * Picking a color is left to the native color input: Chromium's own picker
 * already offers a 2-D surface, a hue strip and HEX/RGB/HSL entry, and fires
 * input events while dragging, which become live previews here.
 */

import { colorToApply, isHexColor, pickerColor } from "../hexColor";
import { ScopeName, ScopeValues, displayForScope } from "../panelState";

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): { scope?: string } | undefined;
  setState(state: unknown): void;
};

const vscode = acquireVsCodeApi();

/**
 * The theme color an empty row stands for, as the native input can show it.
 *
 * VS Code sets every theme color as a css variable on the webview's root, so
 * the color in force is read rather than guessed; a row without one, or a
 * value the input cannot hold, shows black as before.
 */
function themeColorOf(input: HTMLInputElement): string {
  const variable = input.dataset.themeVar;
  if (!variable) {
    return pickerColor("");
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return pickerColor(value);
}

function scope(): ScopeName {
  const checked = document.querySelector(
    'input[name="scope"]:checked'
  ) as HTMLInputElement | null;
  return checked ? (checked.value as ScopeName) : "workspace";
}
/**
 * Put the radio back where the reader left it.
 *
 * The iframe is destroyed whenever the view is hidden and the script
 * re-runs from the baked html, which always checks workspace. Setting
 * checked from script fires no change event, so nothing is redrawn here:
 * the redraw comes with the state the ready message asks for.
 */
const persisted = vscode.getState();
if (persisted && (persisted.scope === "user" || persisted.scope === "workspace")) {
  const restored = document.querySelector(
    'input[name="scope"][value="' + persisted.scope + '"]'
  ) as HTMLInputElement | null;
  if (restored) {
    restored.checked = true;
  }
}
function markPending(key: string, pending: boolean) {
  const row = document.querySelector('[data-row="' + key + '"]');
  if (row) {
    row.classList.toggle("pending", pending);
  }
}
/**
 * The switch of one toggle row.
 *
 * The attribute is assembled rather than written out, so the switch
 * attribute appears literally only in the markup and the order of the
 * sections can be read straight off the output.
 */
function switchOf(key: string): HTMLInputElement | null {
  return document.querySelector(
    "input[data-toggle" + '="' + key + '"]'
  ) as HTMLInputElement | null;
}
document
  .querySelectorAll('input[type="checkbox"][data-toggle]')
  .forEach((element) => {
    const input = element as HTMLInputElement;
    input.addEventListener("change", () => {
      markPending(input.dataset.toggle as string, true);
      vscode.postMessage({
        type: "previewToggle",
        key: input.dataset.toggle,
        value: input.checked,
      });
    });
  });
/** What one row shows for the selected scope, over whatever is staged. */
function shownForScope(
  key: string,
  values: ScopeValues<string | boolean> | undefined,
  pending: { [key: string]: string | boolean } | undefined
) {
  return displayForScope(scope(), key, values || ({} as ScopeValues<string | boolean>), pending || {});
}
/** The words a row uses to name where the value it shows is written. */
const sourceLabels: { [source: string]: string } = {
  workspace: "from workspace",
  user: "from user",
  default: "from default",
  none: "not set",
};
/**
 * Put the source of one row onto the row itself.
 *
 * A row whose value is written somewhere other than the selected scope is
 * dimmed and says so, which is the whole point of the radio: applying to
 * user has to be visible even while the workspace holds its own value.
 */
function markSource(key: string, source: string) {
  const row = document.querySelector(
    '[data-row="' + key + '"]'
  ) as HTMLElement | null;
  if (!row) {
    return;
  }
  row.dataset.source = source;
  row.classList.toggle("inherited", source !== scope());
  const tag = row.querySelector("[data-source-tag]");
  if (tag) {
    tag.textContent = sourceLabels[source] || "";
  }
}
function colorInputOf(key: string): HTMLInputElement | null {
  return document.querySelector(
    'input[type="color"][data-key="' + key + '"]'
  ) as HTMLInputElement | null;
}
function hexFieldOf(key: string): HTMLInputElement | null {
  return document.querySelector(
    '[data-hex-for="' + key + '"]'
  ) as HTMLInputElement | null;
}
/** Echo a picked color into the hex field, unless the reader is typing there. */
function showInHexField(key: string, hex: string) {
  const field = hexFieldOf(key);
  if (!field) {
    return;
  }
  if (field !== document.activeElement) {
    field.value = hex;
  }
  field.classList.remove("invalid");
}
document.querySelectorAll('input[type="color"]').forEach((element) => {
  const input = element as HTMLInputElement;
  input.addEventListener("input", () => {
    markPending(input.dataset.key as string, true);
    showInHexField(input.dataset.key as string, input.value);
    vscode.postMessage({
      type: "preview",
      key: input.dataset.key,
      value: input.value,
    });
  });
});
/** The option a select row is currently showing, staged or saved alike. */
function selectedValue(key: string): string | undefined {
  const marked = document.querySelector(
    '[data-select-for="' + key + '"][data-current="true"]'
  ) as HTMLElement | null;
  return marked ? marked.dataset.value : undefined;
}
/** Move the mark to one option, so exactly one segment reads as current. */
function markSelected(key: string, value: string | boolean | undefined) {
  document
    .querySelectorAll('[data-select-for="' + key + '"]')
    .forEach((element) => {
      const segment = element as HTMLElement;
      if (segment.dataset.value === value) {
        segment.dataset.current = "true";
      } else {
        delete segment.dataset.current;
      }
    });
}
document.querySelectorAll("[data-select-for]").forEach((element) => {
  const segment = element as HTMLElement;
  segment.addEventListener("click", () => {
    const key = segment.dataset.selectFor as string;
    const value = segment.dataset.value;
    markSelected(key, value);
    markPending(key, true);
    // No local rendering: VS Code draws these numbers itself, so the
    // panel can only stage the value and wait for a real write.
    vscode.postMessage({ type: "preview", key: key, value: value });
  });
});
document.querySelectorAll("button[data-apply]").forEach((element) => {
  const button = element as HTMLElement;
  button.addEventListener("click", () => {
    const key = button.dataset.apply as string;
    const selected = selectedValue(key);
    if (selected !== undefined) {
      vscode.postMessage({
        type: "apply",
        key: key,
        value: selected,
        scope: scope(),
      });
      return;
    }
    const field = hexFieldOf(key);
    const color = colorToApply(field ? field.value : "");
    if (color === undefined) {
      field?.classList.toggle("invalid", field.value.trim() !== "");
      return;
    }
    vscode.postMessage({
      type: "apply",
      key: key,
      value: color,
      scope: scope(),
    });
  });
});
document.querySelectorAll("button[data-apply-toggle]").forEach((element) => {
  const button = element as HTMLElement;
  button.addEventListener("click", () => {
    const key = button.dataset.applyToggle as string;
    const box = switchOf(key) as HTMLInputElement;
    vscode.postMessage({
      type: "applyToggle",
      key: key,
      value: box.checked,
      scope: scope(),
    });
  });
});
document.querySelectorAll("[data-hex-for]").forEach((element) => {
  const field = element as HTMLInputElement;
  field.addEventListener("input", () => {
    const key = field.dataset.hexFor as string;
    const hex = field.value.trim();
    if (!isHexColor(hex)) {
      field.classList.add("invalid");
      return;
    }
    field.classList.remove("invalid");
    markPending(key, true);
    const input = colorInputOf(key);
    if (input) {
      input.value = pickerColor(hex);
    }
    vscode.postMessage({ type: "preview", key: key, value: hex });
  });
});
document.querySelectorAll("button[data-reset]").forEach((element) => {
  const button = element as HTMLElement;
  button.addEventListener("click", () => {
    vscode.postMessage({ type: "resetRow", key: button.dataset.reset });
  });
});
document.querySelectorAll("button[data-apply-all]").forEach((button) => {
  button.addEventListener("click", () => {
    vscode.postMessage({ type: "applyAll", scope: scope() });
  });
});
document.querySelectorAll("button[data-reset-all]").forEach((button) => {
  button.addEventListener("click", () => {
    vscode.postMessage({ type: "resetAll" });
  });
});
/** One setting as a state message carries it: what each scope holds. */
interface StateEntry {
  key: string;
  values: ScopeValues<string | boolean>;
}
/**
 * The last thing the extension said, kept so the radio can re-render
 * without asking again.
 *
 * The scope is the panel's own choice, not the extension's; a round trip
 * to redraw rows from values already in hand would only be slower.
 */
let state: {
  toggles: StateEntry[];
  selects: StateEntry[];
  rows: StateEntry[];
  pending: { [key: string]: string | boolean };
} = { toggles: [], selects: [], rows: [], pending: {} };
/** Draw every row for the scope now selected, over whatever is staged. */
function renderState() {
  const pending = state.pending || {};
  (state.toggles || []).forEach((toggle) => {
    const entry = shownForScope(toggle.key, toggle.values, pending);
    const box = switchOf(toggle.key);
    if (box) {
      box.checked = entry.value === true;
    }
    markPending(toggle.key, entry.pending);
    markSource(toggle.key, entry.source);
  });
  (state.selects || []).forEach((select) => {
    const entry = shownForScope(select.key, select.values, pending);
    markSelected(select.key, entry.value);
    markPending(select.key, entry.pending);
    markSource(select.key, entry.source);
  });
  (state.rows || []).forEach((row) => {
    const entry = shownForScope(row.key, row.values, pending);
    // A setting written nowhere shows an empty field: there is no color.
    const color = entry.value === undefined ? "" : String(entry.value);
    markPending(row.key, entry.pending);
    markSource(row.key, entry.source);
    const input = colorInputOf(row.key);
    if (input) {
      input.value = color === "" ? themeColorOf(input) : pickerColor(color);
    }
    // The displayed value wins over whatever is being typed: a reset has
    // to reach a field the reader still has the caret in.
    const field = hexFieldOf(row.key);
    if (field) {
      field.value = color;
      field.classList.remove("invalid");
    }
  });
}
window.addEventListener("message", (event) => {
  const message = event.data;
  if (!message || message.type !== "state") {
    return;
  }
  state = {
    toggles: message.toggles || [],
    selects: message.selects || [],
    rows: message.rows || [],
    pending: message.pending || {},
  };
  renderState();
});
// The radio chooses what the rows show, not only where Apply writes: the
// values of all three scopes are already here, so the flip is local.
document.querySelectorAll('input[name="scope"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    vscode.setState({ scope: scope() });
    renderState();
  });
});
// A theme switch sends no state message: VS Code only rewrites the color
// variables in the root's style attribute, so empty rows re-read them here.
new MutationObserver(renderState).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["style"],
});
// Last, and after the listener above: the baked values are as old as the
// last resolve, and the answer to this must not arrive unheard.
vscode.postMessage({ type: "ready" });

export {};
