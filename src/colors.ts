/**
 * shift hue of color code
 * @param colorCode color code (e.g. #ffffff)
 * @param shift shift value (0～11)
 * @returns shifted color code (e.g. #ffffff)
 */
export function shiftHue(colorCode: string, shift: number) {
  const [r, g, b] = rgbFromColorCode(colorCode);
  const [h, s, l] = hslFromRgb(r, g, b);
  const huePerStep = 360 / 16;
  const hue = (((h + shift * huePerStep) % 360) + 360) % 360;
  return colorCodeFromHsl(hue, s, l);
}

/**
 * get rgb value from color code
 * @param colorCode color code (e.g. #ffffff)
 * @returns RGB value array [r, g, b]
 */
export function rgbFromColorCode(colorCode: string): number[] {
  const hex = colorCode.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return [r, g, b];
}

/**
 * RGB value to HSL value conversion helper function
 * @param r red component (0～255)
 * @param g green component (0～255)
 * @param b blue component (0～255)
 * @returns HSL value array [h, s, l]
 */
export function hslFromRgb(r: number, g: number, b: number): number[] {
  const min = Math.min(r, g, b) / 255;
  const max = Math.max(r, g, b) / 255;
  const delta = max - min;

  let h, s, l;

  if (delta === 0) {
    h = 0;
  } else if (max === r / 255) {
    h = 60 * ((g / 255 - b / 255) / delta);
  } else if (max === g / 255) {
    h = 60 * ((b / 255 - r / 255) / delta + 2);
  } else {
    h = 60 * ((r / 255 - g / 255) / delta + 4);
  }

  if (h < 0) {
    h += 360;
  }

  l = (max + min) / 2;

  if (delta === 0) {
    s = 0;
  } else {
    s = delta / (1 - Math.abs(2 * l - 1));
  }

  return [h, s, l];
}

/**
 * Hsl to #?????? formatted string translation helper function
 * @param h hue
 * @param s saturation
 * @param l luminescence
 * @returns #?????? formatted string
 */
export function colorCodeFromHsl(h: number, s: number, l: number): string {
  const [r, g, b] = rgbFromHsl(h, s, l);
  return rgbToColorCode(r, g, b);
}

/**
 * Hsl to rgb translation helper function
 * @param h hue
 * @param s saturation
 * @param l luminescence
 * @returns HSL value array [h, s, l]
 */
export function rgbFromHsl(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1
      ? [c, x, 0]
      : hp < 2
      ? [x, c, 0]
      : hp < 3
      ? [0, c, x]
      : hp < 4
      ? [0, x, c]
      : hp < 5
      ? [x, 0, c]
      : [c, 0, x];
  const m = l - 0.5 * c;
  const [r, g, b] = [r1 + m, g1 + m, b1 + m];
  return [Math.round(255 * r), Math.round(255 * g), Math.round(255 * b)];
}

/**
 * rgb to #?????? formatted string translation helper function
 * @param r red component (0～255)
 * @param g green component (0～255)
 * @param b blue component (0～255)
 * @returns #?????? formatted string
 */
export function rgbToColorCode(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

