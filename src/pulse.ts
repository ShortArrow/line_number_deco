/** One breath of the diagnostic pulse: about two-thirds of a flash per second, far below WCAG 2.3.1's three. */
export const PULSE_PERIOD_MS = 1600;

/** How far a breath dims the number at its lowest, kept high enough to read. */
const DIMMEST_OPACITY = 0.55;

/**
 * The opacity a pulsing line number has at a moment of its breath.
 *
 * A cosine, so the number eases in and out of its dimmest point instead of
 * stepping, starting and ending each period fully opaque.
 *
 * @param elapsedMs time since the pulse started
 */
export function pulseOpacity(elapsedMs: number): number {
  const phase = (2 * Math.PI * elapsedMs) / PULSE_PERIOD_MS;
  return DIMMEST_OPACITY + ((1 - DIMMEST_OPACITY) * (1 + Math.cos(phase))) / 2;
}

/**
 * Whether diagnostic line numbers pulse.
 *
 * `workbench.reduceMotion` set to "on" stops the pulse. Its default, "auto",
 * follows the operating system, which no extension API exposes, so it is read
 * as allowing motion; the pulse is off unless the user turned it on.
 *
 * @param enabled the `pulseDiagnostics` setting
 * @param reduceMotion the `workbench.reduceMotion` setting: "on", "off" or "auto"
 */
export function isPulseActive(enabled: boolean, reduceMotion: string): boolean {
  return enabled && reduceMotion !== "on";
}
