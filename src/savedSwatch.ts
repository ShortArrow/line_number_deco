/**
 * The saved-color swatch beside a color row's native input.
 *
 * The native input shows what is staged; the swatch shows what is saved for
 * the selected scope, so the two read as before and after. Like hexColor, the
 * module imports nothing and stays inside ES2020: it is bundled into the
 * webview script and also used by the markup, so both fill the swatch alike.
 */

/**
 * The css background one saved color is drawn with.
 *
 * A saved value is drawn as written, alpha included, since a decoration
 * accepts any css color. An empty setting shows the theme color it falls back
 * to, as the variable VS Code sets, and without one shows nothing at all.
 *
 * @param saved the value the selected scope holds, or `""` when it holds none
 * @param themeVariable the css variable of the theme fallback, when there is one
 */
export function savedSwatchFill(saved: string, themeVariable?: string): string {
  if (saved !== "") {
    return saved;
  }
  return themeVariable ? `var(${themeVariable})` : "transparent";
}

/**
 * The words the swatch is read out and hovered as, by the rule of
 * {@link savedSwatchFill}.
 */
export function savedSwatchLabel(saved: string, themeVariable?: string): string {
  if (saved !== "") {
    return `Saved: ${saved}`;
  }
  return themeVariable ? "Saved: theme color" : "Saved: not set";
}
