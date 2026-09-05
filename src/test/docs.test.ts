import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it } from 'mocha';

// The reference tables in docs/ are transcriptions of package.json. A
// transcription rots silently, so every id must appear in its document and
// every id a document lists must still exist — in both directions.

const root = path.resolve(__dirname, '..', '..');
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'package.json'), 'utf8')
);

function read(relative: string): string {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function listedIds(markdown: string, pattern: RegExp): string[] {
  const ids: string[] = [];
  for (const line of markdown.split('\n')) {
    const match = line.match(pattern);
    if (match) {
      ids.push(match[1]);
    }
  }
  return ids;
}

describe('Test the reference documents against the manifest', () => {
  it('Must list every contributed command in docs/commands.md', () => {
    const doc = read('docs/commands.md');
    for (const entry of manifest.contributes.commands) {
      assert.ok(
        doc.includes('`' + entry.command + '`'),
        `docs/commands.md does not list ${entry.command}`
      );
    }
  });

  it('Must not list a command that no longer exists', () => {
    const doc = read('docs/commands.md');
    const known = new Set(
      manifest.contributes.commands.map((entry: { command: string }) => entry.command)
    );
    for (const id of listedIds(doc, /^\| `(line-number-deco\.[A-Za-z]+)`/)) {
      assert.ok(known.has(id), `docs/commands.md lists removed command ${id}`);
    }
  });

  it('Must list every configuration key in docs/settings.md', () => {
    const doc = read('docs/settings.md');
    for (const key of Object.keys(manifest.contributes.configuration.properties)) {
      assert.ok(doc.includes('`' + key + '`'), `docs/settings.md does not list ${key}`);
    }
  });

  it('Must not list a configuration key that no longer exists', () => {
    const doc = read('docs/settings.md');
    const known = new Set(Object.keys(manifest.contributes.configuration.properties));
    for (const id of listedIds(doc, /^\| `(LineNumberDeco\.[A-Za-z]+)`/)) {
      assert.ok(known.has(id), `docs/settings.md lists removed setting ${id}`);
    }
  });
});
