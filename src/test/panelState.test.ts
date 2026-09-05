import * as assert from 'assert';
import { describe, it } from 'mocha';
import { displayForScope, displayToggle, displayValue } from '../panelState';

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
