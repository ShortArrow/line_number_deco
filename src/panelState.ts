/**
 * What a control shows, once the staged value is laid over the saved one.
 *
 * A state message names what is saved, and separately what the panel is still
 * proposing; the two are merged here so the webview and the unit tests reach
 * the same answer instead of two implementations that agree until they drift.
 * Like the hex rule, the module imports nothing and stays inside
 * ES2020: its compiled CommonJS is inlined into the webview script, where
 * there is no module loader and no node standard library.
 */

/** Settings the panel is proposing, keyed by configuration name. */
export interface PendingMap {
  [key: string]: string | boolean;
}

/**
 * A stage or a reset made in the webview, and the number of the message that
 * carried it to the extension. A reset has no value.
 */
export interface LocalEdit {
  value: string | boolean | undefined;
  seq: number;
}

/** The webview's own edits, keyed by configuration name. */
export interface LocalEdits {
  [key: string]: LocalEdit;
}

/**
 * The staged values to display: what a state message carried, with the
 * webview's own unacknowledged edits laid over it.
 *
 * A state message can be posted before the extension has handled an edit the
 * webview already sent, and would then carry the value from before it; the
 * edit wins until a state message acknowledges it. Neither map is changed.
 *
 * @param pending the staged values a state message carried
 * @param edits the webview's edits the extension has not acknowledged yet
 */
export function overlayEdits(pending: PendingMap, edits: LocalEdits): PendingMap {
  const shown: PendingMap = { ...pending };
  for (const key of Object.keys(edits)) {
    const value = edits[key].value;
    if (value === undefined) {
      delete shown[key];
    } else {
      shown[key] = value;
    }
  }
  return shown;
}

/**
 * The entries numbered past an acknowledgement, which the extension has not
 * finished handling yet. The given map is not changed.
 *
 * @param entries anything the webview tracks per key by message number
 * @param acknowledged the number of the last message the extension handled
 */
export function unacknowledged<T extends { seq: number }>(
  entries: { [key: string]: T },
  acknowledged: number
): { [key: string]: T } {
  const kept: { [key: string]: T } = {};
  for (const key of Object.keys(entries)) {
    if (entries[key].seq > acknowledged) {
      kept[key] = entries[key];
    }
  }
  return kept;
}

/**
 * The number of the last message of this webview instance the extension has
 * handled, as a state message acknowledges it; 0 when the acknowledgement is
 * missing or belongs to another instance, such as the one a hidden view
 * destroyed, whose numbering has nothing to do with this one's.
 *
 * @param ack the acknowledgement a state message carried, not to be trusted
 * @param instance the id this webview instance sends with every message
 */
export function acknowledgedSeq(ack: unknown, instance: string): number {
  if (!ack || typeof ack !== "object") {
    return 0;
  }
  const { instance: from, seq } = ack as { instance?: unknown; seq?: unknown };
  return from === instance && typeof seq === "number" ? seq : 0;
}

/**
 * What to write into a row's hex field at a render, or undefined to leave it.
 *
 * A field the reader has focus in keeps what they are typing while the row
 * shows the same value as at the previous render; only a change of the shown
 * value, such as a reset, reaches it.
 *
 * @param focused whether the reader has focus in the field
 * @param previouslyShown the value the row showed at the previous render
 * @param shown the value the row shows now
 */
export function hexFieldText(
  focused: boolean,
  previouslyShown: string | undefined,
  shown: string
): string | undefined {
  return !focused || previouslyShown !== shown ? shown : undefined;
}

/** One value to display, and whether it is staged rather than saved. */
export interface DisplayEntry {
  value: string;
  pending: boolean;
}

/**
 * The text one row shows: the staged value when there is one, else the saved.
 *
 * An entry of the wrong type is not this row's: previews of switches and of
 * enumerated settings share one store, so a boolean parked under this key is
 * ignored rather than rendered.
 *
 * @param saved the value the configuration currently holds
 * @param key the configuration name this row edits
 * @param pending everything the panel is proposing
 */
export function displayValue(
  saved: string,
  key: string,
  pending: PendingMap
): DisplayEntry {
  const staged = pending[key];
  if (typeof staged === "string") {
    return { value: staged, pending: true };
  }
  return { value: saved, pending: false };
}

/** The state one switch shows, by the same rule as {@link displayValue}. */
export function displayToggle(
  saved: boolean,
  key: string,
  pending: PendingMap
): { value: boolean; pending: boolean } {
  const staged = pending[key];
  if (typeof staged === "boolean") {
    return { value: staged, pending: true };
  }
  return { value: saved, pending: false };
}

/** What one setting holds in each place it can be written, as inspect() reports it. */
export interface ScopeValues<T> {
  defaultValue: T | undefined;
  userValue: T | undefined;
  workspaceValue: T | undefined;
}

/** The scope the radio at the top of the panel currently selects. */
export type ScopeName = "workspace" | "user";

/**
 * The scope the panel opens on.
 *
 * Without a folder there are no Workspace settings to write, so the panel
 * opens on User whatever it remembers; with one, it reopens on the scope the
 * reader left it on, and on Workspace when it remembers nothing usable.
 *
 * @param remembered the scope the webview state holds, not to be trusted
 * @param hasWorkspace whether a folder is open
 */
export function initialScope(remembered: unknown, hasWorkspace: boolean): ScopeName {
  if (!hasWorkspace) {
    return "user";
  }
  return remembered === "user" ? "user" : "workspace";
}

/** Why the Workspace radio is disabled while no folder is open. */
export const noFolderTitle = "Open a folder to edit Workspace settings";

/**
 * One row's display: the value, where that value is written, and whether the
 * panel is only proposing it.
 *
 * The source is named even while a value is staged, so a row can say it is
 * staging over what the workspace holds rather than over nothing.
 */
export interface ScopedDisplay<T> {
  value: T | undefined;
  source: "workspace" | "user" | "default" | "none";
  pending: boolean;
}

/**
 * Where the selected scope reads one setting from, and what it finds there.
 *
 * The workspace view falls back through the user value to the default, the way
 * the editor itself resolves a setting. The user view never consults the
 * workspace value: a panel that showed the effective value could not show what
 * applying to user had just written, because any workspace value hid it.
 *
 * @param scope which scope the radio selects
 * @param key the configuration name this row edits
 * @param values what the setting holds in each place, from inspect()
 * @param pending everything the panel is proposing
 */
export function displayForScope<T extends string | boolean>(
  scope: ScopeName,
  key: string,
  values: ScopeValues<T>,
  pending: PendingMap
): ScopedDisplay<T> {
  const saved = savedForScope(scope, values);
  const staged = pending[key];
  if (staged !== undefined && typeof staged === typeOfSetting(values)) {
    return { value: staged as T, source: saved.source, pending: true };
  }
  return { value: saved.value, source: saved.source, pending: false };
}

/**
 * Which family a setting belongs to, read off whichever value it holds.
 *
 * Switches and colors share one store of staged values, so a row has to be
 * able to say that a boolean parked under a color key is not its own. A
 * setting written nowhere at all names no family, and then any staged value of
 * either type is taken as this row's — nothing else can claim it.
 */
function typeOfSetting<T extends string | boolean>(
  values: ScopeValues<T>
): "string" | "boolean" | undefined {
  const known =
    values.workspaceValue ?? values.userValue ?? values.defaultValue;
  return known === undefined ? undefined : (typeof known as "string" | "boolean");
}

/** The value the selected scope resolves to before anything is staged over it. */
function savedForScope<T extends string | boolean>(
  scope: ScopeName,
  values: ScopeValues<T>
): { value: T | undefined; source: "workspace" | "user" | "default" | "none" } {
  if (scope === "workspace" && values.workspaceValue !== undefined) {
    return { value: values.workspaceValue, source: "workspace" };
  }
  if (values.userValue !== undefined) {
    return { value: values.userValue, source: "user" };
  }
  if (values.defaultValue !== undefined) {
    return { value: values.defaultValue, source: "default" };
  }
  return { value: undefined, source: "none" };
}

/** The words the hover text uses for each place a value can be written. */
const placeNames = {
  workspace: "Workspace settings",
  user: "User settings",
  default: "the default",
};

/**
 * The hover text of a row dimmed because its value is written elsewhere.
 *
 * It names the scope the radio selects and the one the value comes from; a
 * row holding no value anywhere names the places it would have inherited
 * from. A row showing the selected scope's own value is not dimmed and gets
 * no text.
 *
 * @param selectedScope the scope the radio selects
 * @param source where the shown value is written, from {@link displayForScope}
 */
export function inheritedTitle(
  selectedScope: ScopeName,
  source: ScopedDisplay<string | boolean>["source"]
): string {
  if (source === selectedScope) {
    return "";
  }
  const unset = `Not set in ${placeNames[selectedScope]}`;
  if (source !== "none") {
    return `${unset}; showing the value from ${placeNames[source]}.`;
  }
  const inherits = selectedScope === "workspace" ? "User settings or the default" : "the default";
  return `${unset}; nothing to inherit from ${inherits}.`;
}
