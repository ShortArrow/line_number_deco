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
 *
 * Every message carries this instance's id and a number one higher than the
 * message before it, and every state message acknowledges the last message
 * the extension finished handling. A stage or reset made here is kept as a
 * local edit and laid over the staged values each state message carries until
 * a state message acknowledges it, so a state posted before the extension saw
 * the edit cannot undo it. An Apply marks its row busy, and Apply all every
 * staged row, until the state message that acknowledges the click; a busy
 * row's Apply and, while any row is busy, Apply all are disabled. The instance
 * id keeps acknowledgements meant for an iframe that a hidden view destroyed
 * from being read as this one's.
 */

import { colorToApply, isHexColor, pickerColor } from "../hexColor";
import {
  LocalEdits,
  PendingMap,
  ScopeName,
  ScopedDisplay,
  ScopeValues,
  acknowledgedSeq,
  displayForScope,
  hexFieldText,
  inheritedTitle,
  overlayEdits,
  unacknowledged,
} from "../panelState";
import { savedSwatchFill, savedSwatchLabel } from "../savedSwatch";

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): { scope?: string } | undefined;
  setState(state: unknown): void;
};

const vscode = acquireVsCodeApi();

const instance = String(Date.now()) + "-" + Math.random().toString(36).slice(2);
let lastSeq = 0;
/** Post one message, numbered, and return its number. */
function post(message: { type: string; [field: string]: unknown }): number {
  lastSeq += 1;
  vscode.postMessage({ ...message, instance: instance, seq: lastSeq });
  return lastSeq;
}
/** Stages and resets made here that no state message has acknowledged yet. */
let edits: LocalEdits = {};
/** Rows whose Apply, or an Apply all covering them, no state message has acknowledged yet. */
let busy: { [key: string]: { seq: number } } = {};

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
      postStaged("previewToggle", input.dataset.toggle as string, input.checked);
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
 * dimmed and says so, in its tag and in its title, which is the whole point
 * of the radio: applying to user has to be visible even while the workspace
 * holds its own value.
 */
function markSource(key: string, source: ScopedDisplay<string | boolean>["source"]) {
  const row = document.querySelector(
    '[data-row="' + key + '"]'
  ) as HTMLElement | null;
  if (!row) {
    return;
  }
  row.dataset.source = source;
  row.classList.toggle("inherited", source !== scope());
  const title = inheritedTitle(scope(), source);
  if (title) {
    row.title = title;
  } else {
    row.removeAttribute("title");
  }
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
/**
 * Fill one row's saved swatch with what the selected scope holds.
 *
 * The fill is cleared first, so a saved value the browser rejects as a color
 * leaves the swatch empty rather than showing the previous scope's color.
 */
function showSaved(key: string, saved: string, themeVariable: string | undefined) {
  const swatch = document.querySelector(
    '[data-saved-for="' + key + '"]'
  ) as HTMLElement | null;
  if (!swatch) {
    return;
  }
  const label = savedSwatchLabel(saved, themeVariable);
  swatch.style.background = "";
  swatch.style.background = savedSwatchFill(saved, themeVariable);
  swatch.setAttribute("aria-label", label);
  swatch.title = label;
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
    postStaged("preview", input.dataset.key as string, input.value);
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
    // Nothing is rendered in the editor: VS Code draws these numbers itself,
    // so the panel can only stage the value and wait for a real write.
    postStaged("preview", key, value as string);
  });
});
document.querySelectorAll("button[data-apply]").forEach((element) => {
  const button = element as HTMLElement;
  button.addEventListener("click", () => {
    const key = button.dataset.apply as string;
    if (selectedValue(key) === undefined) {
      const field = hexFieldOf(key);
      if (colorToApply(field ? field.value : "") === undefined) {
        field?.classList.toggle("invalid", field.value.trim() !== "");
        return;
      }
    }
    // The extension writes the value it has staged, which is the one this
    // row shows: every stage was posted before this click.
    markBusy([key], post({ type: "apply", key: key, scope: scope() }));
  });
});
document.querySelectorAll("button[data-apply-toggle]").forEach((element) => {
  const button = element as HTMLElement;
  button.addEventListener("click", () => {
    const key = button.dataset.applyToggle as string;
    markBusy([key], post({ type: "applyToggle", key: key, scope: scope() }));
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
    field.dataset.shown = hex;
    postStaged("preview", key, hex);
  });
});
document.querySelectorAll("button[data-reset]").forEach((element) => {
  const button = element as HTMLElement;
  button.addEventListener("click", () => {
    const key = button.dataset.reset as string;
    const seq = post({ type: "resetRow", key: key });
    edits = { ...edits, [key]: { value: undefined, seq: seq } };
    renderState();
  });
});
document.querySelectorAll("button[data-apply-all]").forEach((button) => {
  button.addEventListener("click", () => {
    markBusy(Object.keys(shownPending()), post({ type: "applyAll", scope: scope() }));
  });
});
document.querySelectorAll("button[data-reset-all]").forEach((button) => {
  button.addEventListener("click", () => {
    const seq = post({ type: "resetAll" });
    const reset: LocalEdits = {};
    Object.keys(shownPending()).forEach((key) => {
      reset[key] = { value: undefined, seq: seq };
    });
    edits = { ...edits, ...reset };
    renderState();
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
/**
 * Stage one value and send it to the extension as a preview.
 *
 * The value is kept as a local edit until a state message acknowledges it;
 * otherwise a radio flip, a theme change or a state message posted before the
 * extension saw the preview would redraw this row from the saved value.
 */
function postStaged(type: "preview" | "previewToggle", key: string, value: string | boolean) {
  const seq = post({ type: type, key: key, value: value });
  edits = { ...edits, [key]: { value: value, seq: seq } };
}
/** The staged values as this panel shows them: the extension's, under the local edits. */
function shownPending(): PendingMap {
  return overlayEdits(state.pending || {}, edits);
}
/** Mark rows busy from one Apply or Apply all click until it is acknowledged. */
function markBusy(keys: string[], seq: number) {
  keys.forEach((key) => {
    busy = { ...busy, [key]: { seq: seq } };
  });
  renderBusy();
}
/** Disable the Apply of every busy row, and Apply all while any row is busy. */
function renderBusy() {
  document
    .querySelectorAll("button[data-apply], button[data-apply-toggle]")
    .forEach((element) => {
      const button = element as HTMLButtonElement;
      const key = button.dataset.apply ?? button.dataset.applyToggle ?? "";
      button.disabled = busy[key] !== undefined;
    });
  document.querySelectorAll("button[data-apply-all]").forEach((element) => {
    (element as HTMLButtonElement).disabled = Object.keys(busy).length > 0;
  });
}
/** Draw every row for the scope now selected, over whatever is staged. */
function renderState() {
  const pending = shownPending();
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
    const saved = shownForScope(row.key, row.values, {}).value;
    showSaved(row.key, saved === undefined ? "" : String(saved), input?.dataset.themeVar);
    const field = hexFieldOf(row.key);
    if (field) {
      const text = hexFieldText(field === document.activeElement, field.dataset.shown, color);
      if (text !== undefined) {
        field.value = text;
        field.classList.remove("invalid");
      }
      field.dataset.shown = color;
    }
  });
  renderBusy();
}
window.addEventListener("message", (event) => {
  const message = event.data;
  if (!message || message.type !== "state") {
    return;
  }
  const acknowledged = acknowledgedSeq(message.ack, instance);
  edits = unacknowledged(edits, acknowledged);
  busy = unacknowledged(busy, acknowledged);
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
post({ type: "ready" });

export {};
