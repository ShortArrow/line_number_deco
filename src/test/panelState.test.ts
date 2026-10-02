import * as assert from 'assert';
import { describe, it } from 'mocha';
import type { ScopeName, ScopedDisplay } from '../panelState';

type Source = ScopedDisplay<string>['source'];
import { displayForScope, displayToggle, displayValue, inheritedTitle, stagePending } from '../panelState';

describe('Test panel display values', () => {
  it('Must show the saved value while nothing is pending', () => {
    assert.deepStrictEqual(displayValue('on', 'editor.lineNumbers', {}), {
      value: 'on',
      pending: false,
    });
  });

  it('Must show the pending value over the saved one', () => {
    assert.deepStrictEqual(
      displayValue('on', 'editor.lineNumbers', {
        'editor.lineNumbers': 'relative',
      }),
      { value: 'relative', pending: true }
    );
  });

  it('Must ignore a pending entry that is not a string', () => {
    assert.deepStrictEqual(displayValue('on', 'k', { k: true }), {
      value: 'on',
      pending: false,
    });
  });

  it('Must show a pending switch over its saved state', () => {
    assert.deepStrictEqual(displayToggle(false, 'enableRainbow', { enableRainbow: true }), {
      value: true,
      pending: true,
    });
    assert.deepStrictEqual(displayToggle(false, 'enableRainbow', {}), {
      value: false,
      pending: false,
    });
  });

  it('Must ignore a pending entry that is not a boolean', () => {
    assert.deepStrictEqual(displayToggle(true, 'k', { k: '#fff' }), {
      value: true,
      pending: false,
    });
  });

  it('Must leave a row alone while another key is pending', () => {
    assert.deepStrictEqual(displayValue('on', 'a', { b: 'off' }), {
      value: 'on',
      pending: false,
    });
  });
});

describe('Test panel display values per scope', () => {
  it('V1 Must show the workspace value in the workspace view', () => {
    assert.deepStrictEqual(
      displayForScope(
        'workspace',
        'centerColorOfRainbow',
        { defaultValue: '#d', userValue: '#u', workspaceValue: '#w' },
        {}
      ),
      { value: '#w', source: 'workspace', pending: false }
    );
  });

  it('V2 Must show the user value in the user view even while a workspace value exists', () => {
    assert.deepStrictEqual(
      displayForScope(
        'user',
        'centerColorOfRainbow',
        { defaultValue: '#d', userValue: '#u', workspaceValue: '#w' },
        {}
      ),
      { value: '#u', source: 'user', pending: false }
    );
  });

  it('V3a Must fall back to the default in the user view when only a workspace value is set', () => {
    assert.deepStrictEqual(
      displayForScope(
        'user',
        'centerColorOfRainbow',
        { defaultValue: '#d', userValue: undefined, workspaceValue: '#w' },
        {}
      ),
      { value: '#d', source: 'default', pending: false }
    );
  });

  it('V3b Must report nothing set in the user view when neither user nor default holds a value', () => {
    assert.deepStrictEqual(
      displayForScope(
        'user',
        'foreground',
        { defaultValue: undefined, userValue: undefined, workspaceValue: '#w' },
        {}
      ),
      { value: undefined, source: 'none', pending: false }
    );
  });

  it('V4 Must show an inherited user value in the workspace view', () => {
    assert.deepStrictEqual(
      displayForScope(
        'workspace',
        'centerColorOfRainbow',
        { defaultValue: '#d', userValue: '#u', workspaceValue: undefined },
        {}
      ),
      { value: '#u', source: 'user', pending: false }
    );
  });

  it('V5 Must lay a pending value over the scope it would otherwise show', () => {
    assert.deepStrictEqual(
      displayForScope(
        'user',
        'centerColorOfRainbow',
        { defaultValue: '#d', userValue: undefined, workspaceValue: '#w' },
        { centerColorOfRainbow: '#p' }
      ),
      { value: '#p', source: 'default', pending: true }
    );
    assert.deepStrictEqual(
      displayForScope(
        'user',
        'foreground',
        { defaultValue: undefined, userValue: undefined, workspaceValue: '#w' },
        { foreground: '#p' }
      ),
      { value: '#p', source: 'none', pending: true }
    );
  });

  it('V6 Must resolve a switch by the same rule and ignore a wrong-typed pending entry', () => {
    assert.deepStrictEqual(
      displayForScope(
        'user',
        'enableRainbow',
        { defaultValue: false, userValue: true, workspaceValue: false },
        {}
      ),
      { value: true, source: 'user', pending: false }
    );
  });

  it('V6 Must ignore a string parked under a switch key', () => {
    assert.deepStrictEqual(
      displayForScope(
        'user',
        'enableRainbow',
        { defaultValue: false, userValue: true, workspaceValue: false },
        { enableRainbow: '#fff' }
      ),
      { value: true, source: 'user', pending: false }
    );
  });

  it('V7 Must leave a row alone while another key is pending', () => {
    assert.deepStrictEqual(
      displayForScope(
        'workspace',
        'a',
        { defaultValue: '#d', userValue: undefined, workspaceValue: '#w' },
        { b: '#p' }
      ),
      { value: '#w', source: 'workspace', pending: false }
    );
  });
});

describe('Test the hover text of a dimmed row', () => {
  const cases: [ScopeName, Source, string][] = [
    ['workspace', 'user', 'Not set in Workspace settings; showing the value from User settings.'],
    ['workspace', 'default', 'Not set in Workspace settings; showing the value from the default.'],
    ['workspace', 'none', 'Not set in Workspace settings; nothing to inherit from User settings or the default.'],
    ['user', 'default', 'Not set in User settings; showing the value from the default.'],
    ['user', 'none', 'Not set in User settings; nothing to inherit from the default.'],
    ['workspace', 'workspace', ''],
    ['user', 'user', ''],
  ];
  for (const [selected, source, title] of cases) {
    it(`Must read ${JSON.stringify(title)} for ${source} under ${selected}`, () => {
      assert.strictEqual(inheritedTitle(selected, source), title);
    });
  }
});

describe('Test staging a value in the webview', () => {
  it('S1 Must make a staged color show over the saved one at the next render', () => {
    const staged = stagePending({}, 'c', '#123abc');
    assert.deepStrictEqual(
      displayForScope('user', 'c', { defaultValue: undefined, userValue: '#000000', workspaceValue: undefined }, staged),
      { value: '#123abc', source: 'user', pending: true }
    );
  });

  it('S2 Must make a staged switch show over the saved one at the next render', () => {
    const staged = stagePending({}, 'enableRainbow', true);
    assert.deepStrictEqual(
      displayForScope('workspace', 'enableRainbow', { defaultValue: false, userValue: undefined, workspaceValue: undefined }, staged),
      { value: true, source: 'default', pending: true }
    );
  });

  it('S3 Must replace an earlier staged value of the same key and keep the others', () => {
    assert.deepStrictEqual(stagePending({ c: '#111111', d: '#222222' }, 'c', '#333333'), {
      c: '#333333',
      d: '#222222',
    });
  });

  it('S4 Must leave the map it was given untouched', () => {
    const before = { d: '#222222' };
    stagePending(before, 'c', '#333333');
    assert.deepStrictEqual(before, { d: '#222222' });
  });
});
