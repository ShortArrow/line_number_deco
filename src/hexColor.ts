/**
 * The hex colors the settings panel accepts, and the subset a native color
 * input can hold.
 *
 * Like panelState, the module imports nothing and stays inside ES2020: it is
 * bundled into the webview script and also used by the extension, so the hex
 * field and the rendered markup agree on one rule.
 */

const hexColorPattern = /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const opaqueHexPattern = /^#[0-9a-fA-F]{6}$/;

/**
 * Whether the hex field may preview this text.
 *
 * Both `#rrggbb` and `#rrggbbaa` pass, in either case: Chromium's picker can
 * produce an alpha channel, and a decoration accepts any css color.
 */
export function isHexColor(value: string): boolean {
  return hexColorPattern.test(value);
}

/**
 * The value a native color input is given for one saved color.
 *
 * The input holds `#rrggbb` only. An alpha hex shows its color without the
 * alpha; anything else — an empty setting that leaves the theme color in
 * force, a css name — shows as black, and the row's source tag says where
 * the value really comes from.
 */
export function pickerColor(value: string): string {
  if (opaqueHexPattern.test(value)) {
    return value;
  }
  return hexColorPattern.test(value) ? value.slice(0, 7) : "#000000";
}

/**
 * The color a row's Apply writes, given the text in its hex field.
 *
 * Only a valid hex is written. The native input is never a fallback: on an
 * untouched row it holds the theme color, or black, and saving that would
 * pin the row to it instead of leaving the theme in force.
 */
export function colorToApply(fieldValue: string): string | undefined {
  const typed = fieldValue.trim();
  return isHexColor(typed) ? typed : undefined;
}
