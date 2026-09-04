import * as assert from 'assert';
import { describe, it } from 'mocha';
import { Hsl, Rgb, hexToHsl, hexToRgb, hslToHex, rgbToHex } from '../colorConvert';

const cases: { hex: string; rgb: Rgb; hsl: Hsl }[] = [
  { hex: '#ff0000', rgb: { r: 255, g: 0, b: 0 }, hsl: { h: 0, s: 100, l: 50 } },
  { hex: '#00ff00', rgb: { r: 0, g: 255, b: 0 }, hsl: { h: 120, s: 100, l: 50 } },
  { hex: '#0000ff', rgb: { r: 0, g: 0, b: 255 }, hsl: { h: 240, s: 100, l: 50 } },
  { hex: '#ffa500', rgb: { r: 255, g: 165, b: 0 }, hsl: { h: 39, s: 100, l: 50 } },
  { hex: '#808080', rgb: { r: 128, g: 128, b: 128 }, hsl: { h: 0, s: 0, l: 50 } },
  { hex: '#ffffff', rgb: { r: 255, g: 255, b: 255 }, hsl: { h: 0, s: 0, l: 100 } },
  { hex: '#000000', rgb: { r: 0, g: 0, b: 0 }, hsl: { h: 0, s: 0, l: 0 } },
];

const malformed = ['ff0000', '#ff000', '#ff00zz', '#ff0000ff', 'red', ''];

const roundTrips = ['#1e90ff', '#d9dcff', '#123456', '#e7ffc8'];

describe('Test convert colors between hex, rgb and hsl', () => {
  for (const { hex, rgb } of cases) {
    it(`Must read ${hex} as its rgb channels`, () => {
      assert.deepStrictEqual(hexToRgb(hex), rgb);
    });
  }

  for (const { hex, rgb } of cases) {
    it(`Must write the rgb channels of ${hex} back as hex`, () => {
      assert.strictEqual(rgbToHex(rgb), hex);
    });
  }

  for (const { hex, hsl } of cases) {
    it(`Must read ${hex} as its hsl components`, () => {
      assert.deepStrictEqual(hexToHsl(hex), hsl);
    });
  }

  for (const { hex, hsl } of cases.filter((entry) => entry.hex !== '#ffa500')) {
    it(`Must write the hsl components of ${hex} back as hex`, () => {
      assert.strictEqual(hslToHex(hsl), hex);
    });
  }

  it('Must write the hsl components of orange back one step off in green', () => {
    // Integer h=39 is not exactly #ffa500 (h is about 38.82), so the reproduced hex differs by one step in green.
    assert.strictEqual(hslToHex({ h: 39, s: 100, l: 50 }), '#ffa600');
  });

  for (const value of malformed) {
    it(`Must refuse ${JSON.stringify(value)} as a hex color`, () => {
      assert.strictEqual(hexToRgb(value), null);
    });
  }

  it('Must write orange channels as lowercase hex', () => {
    assert.strictEqual(rgbToHex({ r: 255, g: 165, b: 0 }), '#ffa500');
  });

  it('Must clamp channels out of range and round the rest', () => {
    assert.strictEqual(rgbToHex({ r: -5, g: 300, b: 12.6 }), '#00ff0d');
  });

  it('Must write hue zero at full saturation as red', () => {
    assert.strictEqual(hslToHex({ h: 0, s: 100, l: 50 }), '#ff0000');
  });

  it('Must wrap hue 360 back to red', () => {
    assert.strictEqual(hslToHex({ h: 360, s: 100, l: 50 }), '#ff0000');
  });

  for (const hex of roundTrips) {
    it(`Must keep every channel of ${hex} within three of a round trip`, () => {
      const before = hexToRgb(hex) as Rgb;
      const after = hexToRgb(hslToHex(hexToHsl(hex) as Hsl)) as Rgb;
      assert.ok(Math.abs(before.r - after.r) <= 3, `red drifted from ${before.r} to ${after.r}`);
      assert.ok(Math.abs(before.g - after.g) <= 3, `green drifted from ${before.g} to ${after.g}`);
      assert.ok(Math.abs(before.b - after.b) <= 3, `blue drifted from ${before.b} to ${after.b}`);
    });
  }
});
