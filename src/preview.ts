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
 * A key leaves the store when it is reset, when the panel is closed, or once a
 * save of exactly its staged value has succeeded; the configured value takes
 * over again from there.
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

/**
 * Clear a key, but only while it still holds the value that was just written.
 *
 * A value staged again while the save was in flight is newer than the save,
 * so it stays staged rather than being lost to the write that preceded it.
 *
 * @param key the configuration name that was saved
 * @param written the value the save wrote
 */
export function clearPreviewIfStaged(key: string, written: string | boolean) {
  if (previews.get(key) === written) {
    previews.delete(key);
  }
}

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

/** The value staged for one key, of whichever type, or undefined. */
export function getPendingPreview(key: string): string | boolean | undefined {
  return previews.get(key);
}

/** Everything pending, so one action can commit all of it. */
export function getPendingPreviews(): PendingPreview[] {
  return [...previews].map(([key, value]) => ({ key, value }));
}
