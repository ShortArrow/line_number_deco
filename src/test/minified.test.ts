import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { transformSync } from 'esbuild';
import { describe, it } from 'mocha';
import * as vscode from 'vscode';

// The suite runs against the modules the extension host loaded, so checking
// that those modules are minified is what makes the rest of the suite a test
// of the code that ships.

const extension = vscode.extensions.getExtension('ShortArrow.line-number-deco');

/**
 * The compiled modules beside the manifest's entry point, and under its
 * generated folder. `webviewAssets.js` is left out: it holds one string the
 * webview bundler already minified, which reads the same either way.
 */
function shippedModules(): string[] {
  const root = extension!.extensionPath;
  const entry = path.resolve(root, extension!.packageJSON.main);
  const folders = [path.dirname(entry), path.join(path.dirname(entry), 'generated')];
  return folders.flatMap((folder) =>
    fs.readdirSync(folder)
      .filter((name) => name.endsWith('.js') && name !== 'webviewAssets.js')
      .map((name) => path.join(folder, name))
  );
}

describe('Test the shipped modules are minified', () => {
  it('Must load the extension from the manifest entry point', () => {
    assert.ok(extension, 'the extension under test is not installed');
    const entry = require.resolve(path.resolve(extension.extensionPath, extension.packageJSON.main));
    // Windows hands the extension host a lower-case drive letter.
    const loaded = Object.keys(require.cache).map((key) => key.toLowerCase());
    assert.ok(loaded.includes(entry.toLowerCase()), `${entry} was not loaded`);
  });

  // Minifying minified code again saves next to nothing, where tsc's output
  // loses about a third; the strings a module carries keep their newlines.
  // `pnpm coverage` measures tsc's output, whose source maps name every line,
  // so under it these checks are pending.
  const check = process.env.NODE_V8_COVERAGE ? it.skip : it;
  for (const file of shippedModules()) {
    check(`${path.basename(file)} must shrink by less than a tenth when minified again`, () => {
      const shipped = fs.readFileSync(file, 'utf8').replace(/\n\/\/# sourceMappingURL=.*\n?$/, '');
      const again = transformSync(shipped, { minify: true, format: 'cjs', platform: 'node', target: 'es2020' }).code;
      assert.ok(again.length > shipped.length * 0.9, `${file}: ${shipped.length} bytes became ${again.length}`);
    });
  }
});
