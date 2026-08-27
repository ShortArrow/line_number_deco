/**
 * Colors a picker is currently proposing, keyed by configuration name.
 *
 * The color panel writes here while one of its pickers is being dragged, and the
 * config getters read an override before the configuration itself, so the editors
 * render the candidate color without anything being written to settings. Hiding
 * the panel clears the overrides and the configured colors take over again.
 */
const previews = new Map<string, string>();

export function setPreviewColor(key: string, value: string) {
  previews.set(key, value);
}

export function clearPreviewColor(key: string) {
  previews.delete(key);
}

export function clearAllPreviews() {
  previews.clear();
}

export function getPreviewColor(key: string) {
  return previews.get(key);
}
