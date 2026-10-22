import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it } from 'mocha';
import { contrastRatio } from '../colors';
import { nameOfExtension, settingDefaults } from '../config';

// VS Code disables an extension in Restricted Mode, and hides it from virtual
// workspaces, unless the manifest says it is safe there. This one reads no
// workspace files and runs no workspace code, so it declares full support.

const root = path.resolve(__dirname, '..', '..');
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'package.json'), 'utf8')
);

describe('Test manifest capabilities', () => {
  it('Must stay enabled in an untrusted workspace', () => {
    assert.deepStrictEqual(manifest.capabilities?.untrustedWorkspaces, {
      supported: true,
    });
  });

  it('Must run in a virtual workspace', () => {
    assert.strictEqual(manifest.capabilities?.virtualWorkspaces, true);
  });
});

// The code falls back to a default of its own when a setting is absent, and
// that default must be the one the manifest declares.

describe('Test manifest setting defaults', () => {
  for (const [setting, fallback] of Object.entries(settingDefaults)) {
    it(`${nameOfExtension}.${setting} must fall back to the manifest default`, () => {
      assert.strictEqual(
        fallback,
        manifest.contributes.configuration.properties[
          `${nameOfExtension}.${setting}`
        ]?.default
      );
    });
  }
});

// Three highlight colors resolve through theme colors when their setting is
// empty, so a light theme gets a readable shade while a dark theme keeps the
// color these settings used to default to.

const themedHighlights = [
  {
    setting: 'LineNumberDeco.foregroundColorOfRepeatingDigits',
    themeColor: 'LineNumberDeco.repeatingDigitsForeground',
    previousDefault: '#00ff00',
  },
  {
    setting: 'LineNumberDeco.foregroundColorOfSequentialDigits',
    themeColor: 'LineNumberDeco.sequentialDigitsForeground',
    previousDefault: '#ffa500',
  },
  {
    setting: 'LineNumberDeco.foregroundColorOfMultiplesOfFive',
    themeColor: 'LineNumberDeco.multiplesOfFiveForeground',
    previousDefault: '#c678dd',
  },
];

type ColorDefaults = {
  dark: string;
  light: string;
  highContrast: string;
  highContrastLight: string;
};

function colorDefaultsOf(id: string): ColorDefaults | undefined {
  const colors: { id: string; defaults: ColorDefaults }[] =
    manifest.contributes?.colors ?? [];
  return colors.find((color) => color.id === id)?.defaults;
}

const minimumContrast = 4.5;
const lightBackground = '#ffffff';
const darkBackground = '#1e1e1e';

describe('Test manifest theme colors of highlights', () => {
  for (const { setting, themeColor, previousDefault } of themedHighlights) {
    it(`${setting} must default to empty, deferring to the theme`, () => {
      assert.strictEqual(
        manifest.contributes.configuration.properties[setting]?.default,
        ''
      );
    });

    it(`${themeColor} must exist with a default for every theme kind`, () => {
      const defaults = colorDefaultsOf(themeColor);
      assert.ok(defaults, `${themeColor} is not in contributes.colors`);
      for (const kind of ['dark', 'light', 'highContrast', 'highContrastLight'] as const) {
        assert.match(defaults[kind], /^#[0-9a-f]{6}$/i, `${kind} of ${themeColor}`);
      }
    });

    it(`${themeColor} must keep the previous default on dark themes`, () => {
      const defaults = colorDefaultsOf(themeColor);
      assert.strictEqual(defaults?.dark, previousDefault);
      assert.strictEqual(defaults?.highContrast, previousDefault);
    });

    it(`${themeColor} must be readable against its theme's background`, () => {
      const defaults = colorDefaultsOf(themeColor);
      assert.ok(defaults, `${themeColor} is not in contributes.colors`);
      const cases: [string, string, string][] = [
        ['light', defaults.light, lightBackground],
        ['highContrastLight', defaults.highContrastLight, lightBackground],
        ['dark', defaults.dark, darkBackground],
      ];
      for (const [kind, color, background] of cases) {
        const ratio = contrastRatio(color, background);
        assert.ok(
          ratio >= minimumContrast,
          `${kind} ${color} on ${background} is ${ratio.toFixed(2)}`
        );
      }
    });
  }
});
