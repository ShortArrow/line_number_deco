/**
 * What a control shows, once the staged value is laid over the saved one.
 *
 * A state message names what is saved, and separately what the panel is still
 * proposing; the two are merged here so the webview and the unit tests reach
 * the same answer instead of two implementations that agree until they drift.
 * Like the color conversions, the module imports nothing and stays inside
 * ES2020: its compiled CommonJS is inlined into the webview script, where
 * there is no module loader and no node standard library.
 */

/** Settings the panel is proposing, keyed by configuration name. */
export interface PendingMap {
  [key: string]: string | boolean;
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
