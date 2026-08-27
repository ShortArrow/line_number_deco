export interface TimerHost {
  now(): number;
  setTimeout(callback: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

const systemHost: TimerHost = {
  now: () => Date.now(),
  setTimeout: (callback, ms) => setTimeout(callback, ms),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/**
 * Leading-plus-trailing throttle. The first call in a quiet period runs
 * immediately; calls arriving within delayMs of the last run are coalesced
 * into one trailing run with the latest arguments, and the window re-anchors
 * at every run. Keyboard auto-repeat therefore repaints at most once per
 * delayMs while the first keypress stays instant (#38).
 */
export function throttleTrailing<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs: number,
  host: TimerHost = systemHost
): (...args: A) => void {
  let lastRunAt: number | undefined;
  let handle: unknown;
  let latestArgs: A | undefined;

  const run = (args: A) => {
    lastRunAt = host.now();
    fn(...args);
  };

  const fireTrailing = () => {
    handle = undefined;
    const args = latestArgs as A;
    latestArgs = undefined;
    run(args);
  };

  return (...args: A) => {
    latestArgs = args;
    if (handle !== undefined) {
      return;
    }
    const elapsed = lastRunAt === undefined ? delayMs : host.now() - lastRunAt;
    if (elapsed >= delayMs) {
      latestArgs = undefined;
      run(args);
      return;
    }
    handle = host.setTimeout(fireTrailing, delayMs - elapsed);
  };
}
