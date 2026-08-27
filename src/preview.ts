/** One setting a control is currently proposing, before anything is saved. */
export interface PendingPreview {
  key: string;
  value: string | boolean;
}

/**
 * Settings the panel is currently proposing, keyed by configuration name.
 *
 * The panel writes here while a picker is being dragged or a switch is flipped,
 * and the config getters read an override before the configuration itself, so
 * the editors render the candidate without anything being written to settings.
 * Applying one row, applying all of them, or hiding the panel clears what is
 * pending and the configured values take over again.
 */
const previews = new Map<string, string | boolean>();

export function setPreviewColor(key: string, value: string) {
  previews.set(key, value);
}

export function setPreviewToggle(key: string, value: boolean) {
  previews.set(key, value);
}

export function clearPreview(key: string) {
  previews.delete(key);
}

/** The name the color rows have always used for {@link clearPreview}. */
export const clearPreviewColor = clearPreview;

export function clearAllPreviews() {
  previews.clear();
}

export function getPreviewColor(key: string) {
  const value = previews.get(key);
  return typeof value === "string" ? value : undefined;
}

export function getPreviewToggle(key: string) {
  const value = previews.get(key);
  return typeof value === "boolean" ? value : undefined;
}

/** Everything pending, so one action can commit all of it. */
export function getPendingPreviews(): PendingPreview[] {
  return [...previews].map(([key, value]) => ({ key, value }));
}
