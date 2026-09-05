/**
 * Conversions between the three ways the panel names one color.
 *
 * The module imports nothing and stays inside ES2020 on purpose: its compiled
 * CommonJS is also inlined into the webview script, where there is no module
 * loader and no node standard library, so the sliders and the unit tests do the
 * same arithmetic rather than two implementations that agree until they drift.
 */

/** One color as the picker stores it: three channels, each an integer 0–255. */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** One color as the hue slider names it: h 0–360, s and l 0–100, integers. */
export interface Hsl {
  h: number;
  s: number;
  l: number;
}

const hexPattern = /^#[0-9a-fA-F]{6}$/;

function clampChannel(value: number) {
  if (!isFinite(value)) {
    return 0;
  }
  return Math.min(255, Math.max(0, Math.round(value)));
}

function twoDigits(value: number) {
  const digits = value.toString(16);
  return digits.length === 1 ? "0" + digits : digits;
}

/**
 * The channels of a '#rrggbb' string, or null for anything else.
 *
 * @param hex color text, which may well come from a hand-edited setting
 */
export function hexToRgb(hex: string): Rgb | null {
  if (typeof hex !== "string" || !hexPattern.test(hex)) {
    return null;
  }
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

/** Three channels as lowercase '#rrggbb', each clamped to 0–255 and rounded. */
export function rgbToHex(rgb: Rgb): string {
  return (
    "#" +
    twoDigits(clampChannel(rgb.r)) +
    twoDigits(clampChannel(rgb.g)) +
    twoDigits(clampChannel(rgb.b))
  );
}

/** The hue, saturation and lightness of a '#rrggbb' string, or null. */
export function hexToHsl(hex: string): Hsl | null {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return null;
  }
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const span = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (span !== 0) {
    s = span / (1 - Math.abs(2 * l - 1));
    if (max === r) {
      h = 60 * (((g - b) / span) % 6);
    } else if (max === g) {
      h = 60 * ((b - r) / span + 2);
    } else {
      h = 60 * ((r - g) / span + 4);
    }
  }
  if (h < 0) {
    h += 360;
  }
  return {
    h: Math.round(h) % 360,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Hue, saturation and lightness as lowercase '#rrggbb'.
 *
 * The hue wraps, so a slider parked at its 360 end is the same red as 0.
 */
export function hslToHex(hsl: Hsl): string {
  const h = ((hsl.h % 360) + 360) % 360;
  const s = Math.min(100, Math.max(0, hsl.s)) / 100;
  const l = Math.min(100, Math.max(0, hsl.l)) / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const second = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const lift = l - chroma / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = chroma;
    g = second;
  } else if (h < 120) {
    r = second;
    g = chroma;
  } else if (h < 180) {
    g = chroma;
    b = second;
  } else if (h < 240) {
    g = second;
    b = chroma;
  } else if (h < 300) {
    r = second;
    b = chroma;
  } else {
    r = chroma;
    b = second;
  }
  return rgbToHex({
    r: (r + lift) * 255,
    g: (g + lift) * 255,
    b: (b + lift) * 255,
  });
}
