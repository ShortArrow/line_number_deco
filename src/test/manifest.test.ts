import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it } from 'mocha';

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
