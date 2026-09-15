/**
 * The script the settings webview runs.
 *
 * It is bundled at build time rather than pasted together at runtime, so the
 * conversions and the pending merge arrive as ordinary imports: a name that
 * does not exist fails the build instead of leaving the sliders inert.
 */

import {
  Hsl,
  hexToHsl,
  hexToHsv,
  hexToRgb,
  hslToHex,
  hsvToHex,
  rgbToHex,
} from "../colorConvert";
import { ScopeName, ScopeValues, displayForScope } from "../panelState";

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): { scope?: string } | undefined;
  setState(state: unknown): void;
};

const vscode = acquireVsCodeApi();
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
function sliders(key: string) {
  return document.querySelectorAll(
    'input[data-slider-for="' + key + '"]'
  ) as NodeListOf<HTMLInputElement>;
}
function readSliders(key: string, mode: string) {
  const value: { [component: string]: number } = {};
  sliders(key).forEach((slider) => {
    value[slider.dataset.slider as string] = Number(slider.value);
  });
  return mode === "rgb"
    ? { r: value.r, g: value.g, b: value.b }
    : { h: value.h, s: value.s, l: value.l };
}
function activeMode(key: string) {
  const tab = document.querySelector(
    '[data-mode-tab].active[data-mode-for="' + key + '"]'
  ) as HTMLElement | null;
  return tab ? (tab.dataset.modeTab as string) : "hsl";
}
/** Push one hex into both slider triples, so switching mode shows the same color. */
function showOnSliders(key: string, hex: string) {
  const rgb = hexToRgb(hex);
  const hsl = hexToHsl(hex);
  if (!rgb || !hsl) {
    return;
  }
  const parts: { [component: string]: number } = {
    h: hsl.h,
    s: hsl.s,
    l: hsl.l,
    r: rgb.r,
    g: rgb.g,
    b: rgb.b,
  };
  sliders(key).forEach((slider) => {
    slider.value = String(parts[slider.dataset.slider as string]);
  });
  document
    .querySelectorAll('[data-readout-for="' + key + '"]')
    .forEach((element) => {
      const readout = element as HTMLElement;
      readout.textContent = String(parts[readout.dataset.readout as string]);
    });
  paintSliders(key, hsl);
  showOnPlane(key, hex);
  showInHexField(key, hex);
}
/** Repaint the saturation and lightness tracks against the current hue. */
function paintSliders(key: string, hsl: Hsl) {
  const s = document.querySelector(
    'input[data-slider-for="' + key + '"][data-slider="s"]'
  ) as HTMLElement | null;
  const l = document.querySelector(
    'input[data-slider-for="' + key + '"][data-slider="l"]'
  ) as HTMLElement | null;
  if (s) {
    s.style.background =
      "linear-gradient(to right, " +
      hslToHex({ h: hsl.h, s: 0, l: hsl.l }) +
      ", " +
      hslToHex({ h: hsl.h, s: 100, l: hsl.l }) +
      ")";
  }
  if (l) {
    l.style.background =
      "linear-gradient(to right, #000000, " +
      hslToHex({ h: hsl.h, s: hsl.s, l: 50 }) +
      ", #ffffff)";
  }
}
/** Put the marker where one hex sits on the plane and set the hue behind it. */
function showOnPlane(key: string, hex: string) {
  const plane = document.querySelector(
    '[data-plane-for="' + key + '"]'
  ) as HTMLElement | null;
  const marker = document.querySelector(
    '[data-plane-marker="' + key + '"]'
  ) as HTMLElement | null;
  if (!plane || !marker) {
    return;
  }
  const hsv = hexToHsv(hex);
  if (!hsv) {
    return;
  }
  plane.style.background = hsvToHex({ h: hsv.h, s: 100, v: 100 });
  marker.style.left = hsv.s + "%";
  marker.style.top = 100 - hsv.v + "%";
  marker.style.background = hex;
}
/** The hue the plane is currently spending, read back off the row's color. */
function hueOf(key: string) {
  const input = document.querySelector(
    'input[type="color"][data-key="' + key + '"]'
  ) as HTMLInputElement | null;
  const hsv = input ? hexToHsv(input.value) : null;
  return hsv ? hsv.h : 0;
}
function showInHexField(key: string, hex: string) {
  const field = document.querySelector(
    '[data-hex-for="' + key + '"]'
  ) as HTMLInputElement | null;
  if (field && field !== document.activeElement) {
    field.value = hex;
  }
  if (field) {
    field.classList.remove("invalid");
  }
}
function showEverywhere(key: string, hex: string) {
  const input = document.querySelector(
    'input[type="color"][data-key="' + key + '"]'
  ) as HTMLInputElement | null;
  if (input) {
    input.value = hex;
  }
  const swatch = document.querySelector(
    '[data-swatch="' + key + '"]'
  ) as HTMLElement | null;
  if (swatch) {
    swatch.style.background = hex;
    swatch.title = hex;
  }
  showOnSliders(key, hex);
}
document.querySelectorAll('input[type="color"]').forEach((element) => {
  const input = element as HTMLInputElement;
  input.addEventListener("input", () => {
    markPending(input.dataset.key as string, true);
    showOnSliders(input.dataset.key as string, input.value);
    vscode.postMessage({
      type: "preview",
      key: input.dataset.key,
      value: input.value,
    });
  });
});
document
  .querySelectorAll('input[type="range"][data-slider-for]')
  .forEach((element) => {
    const slider = element as HTMLInputElement;
    slider.addEventListener("input", () => {
      const key = slider.dataset.sliderFor as string;
      const mode = activeMode(key);
      const parts = readSliders(key, mode);
      const hex =
        mode === "rgb"
          ? rgbToHex(parts as { r: number; g: number; b: number })
          : hslToHex(parts as Hsl);
      markPending(key, true);
      showEverywhere(key, hex);
      vscode.postMessage({ type: "preview", key: key, value: hex });
    });
  });
document.querySelectorAll("[data-mode-tab]").forEach((element) => {
  const tab = element as HTMLElement;
  tab.addEventListener("click", () => {
    const key = tab.dataset.modeFor as string;
    const mode = tab.dataset.modeTab as string;
    document
      .querySelectorAll('[data-mode-tab][data-mode-for="' + key + '"]')
      .forEach((other) => {
        other.classList.toggle("active", other === tab);
      });
    document
      .querySelectorAll('[data-mode-panel][data-mode-for="' + key + '"]')
      .forEach((element) => {
        const panel = element as HTMLElement;
        panel.classList.toggle("hidden", panel.dataset.modePanel !== mode);
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
    const input = document.querySelector(
      'input[type="color"][data-key="' + key + '"]'
    ) as HTMLInputElement;
    vscode.postMessage({
      type: "apply",
      key: key,
      value: input.value,
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
document.querySelectorAll("[data-plane-for]").forEach((element) => {
  const plane = element as HTMLElement;
  const key = plane.dataset.planeFor as string;
  /** One pointer position as a color: x spends saturation, y spends value downward. */
  function pickAt(event: PointerEvent) {
    const box = plane.getBoundingClientRect();
    const s = Math.round(
      Math.min(100, Math.max(0, ((event.clientX - box.left) / box.width) * 100))
    );
    const v = Math.round(
      100 -
        Math.min(
          100,
          Math.max(0, ((event.clientY - box.top) / box.height) * 100)
        )
    );
    const hex = hsvToHex({ h: hueOf(key), s: s, v: v });
    markPending(key, true);
    showEverywhere(key, hex);
    vscode.postMessage({ type: "preview", key: key, value: hex });
  }
  plane.addEventListener("pointerdown", (event) => {
    // Capture so a drag that leaves the box keeps painting until the button is released.
    plane.setPointerCapture(event.pointerId);
    pickAt(event);
  });
  plane.addEventListener("pointermove", (event) => {
    if (plane.hasPointerCapture(event.pointerId)) {
      pickAt(event);
    }
  });
  plane.addEventListener("pointerup", (event) => {
    plane.releasePointerCapture(event.pointerId);
  });
});
document.querySelectorAll("[data-hex-for]").forEach((element) => {
  const field = element as HTMLInputElement;
  field.addEventListener("input", () => {
    const key = field.dataset.hexFor as string;
    const hex = field.value.trim();
    if (!hexToRgb(hex)) {
      field.classList.add("invalid");
      return;
    }
    field.classList.remove("invalid");
    markPending(key, true);
    showEverywhere(key, hex);
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
    const swatch = document.querySelector(
      '[data-swatch="' + row.key + '"]'
    ) as HTMLElement | null;
    if (swatch) {
      swatch.style.background = color;
      swatch.title = color;
    }
    const input = document.querySelector(
      'input[type="color"][data-key="' + row.key + '"]'
    ) as HTMLInputElement | null;
    if (input && /^#[0-9a-fA-F]{6}$/.test(color)) {
      input.value = color;
    }
    showOnSliders(row.key, /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#000000");
    // The displayed value wins over whatever is being typed: a reset has
    // to reach a field the reader still has the caret in.
    const field = document.querySelector(
      '[data-hex-for="' + row.key + '"]'
    ) as HTMLInputElement | null;
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
document
  .querySelectorAll('input[type="color"][data-key]')
  .forEach((element) => {
    const input = element as HTMLInputElement;
    showOnSliders(input.dataset.key as string, input.value);
  });
// Last, and after the listener above: the baked values are as old as the
// last resolve, and the answer to this must not arrive unheard.
vscode.postMessage({ type: "ready" });

export {};
