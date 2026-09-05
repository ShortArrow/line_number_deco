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
