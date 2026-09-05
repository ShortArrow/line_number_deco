import * as assert from 'assert';
import { describe, it } from 'mocha';
import { PanelRow, PanelSelect, PanelToggle, renderPanelHtml } from '../panelHtml';

/** A triple holding one workspace value, the shape most rows are given here. */
function inWorkspace<T>(value: T) {
  return { defaultValue: undefined, userValue: undefined, workspaceValue: value };
}

/** A triple holding one user value and nothing in the workspace. */
function inUser<T>(value: T) {
  return { defaultValue: undefined, userValue: value, workspaceValue: undefined };
}

/** A setting written nowhere at all. */
function unset<T>() {
  return {
    defaultValue: undefined as T | undefined,
    userValue: undefined as T | undefined,
    workspaceValue: undefined as T | undefined,
  };
}

const rows: PanelRow[] = [
  { key: 'centerColorOfRainbow', label: 'Rainbow center', values: inWorkspace('#8888ff') },
  { key: 'foreground', label: 'Inactive line number', values: unset<string>() },
];

const sel: PanelSelect[] = [
  {
    key: 'editor.lineNumbers',
    label: 'Built-in line numbers',
    values: inWorkspace('relative'),
    options: ['on', 'off', 'relative', 'interval'],
  },
];

const toggles: PanelToggle[] = [
  { key: 'enableRelativeLine', label: 'Relative line numbers', values: inWorkspace(true) },
  { key: 'enableRainbow', label: 'Rainbow', values: inWorkspace(false) },
  { key: 'enableRepeatingDigits', label: 'Repeating digits', values: inWorkspace(false) },
  { key: 'enableSequentialDigits', label: 'Sequential digits', values: inWorkspace(false) },
];

describe('Test render the color panel html', () => {
  it('Must carry the row key on a color input', () => {
    const html = renderPanelHtml(toggles, [], rows, 'n0nce', 'vscode-resource:', '');
    assert.ok(/<input type="color"[^>]*data-key="centerColorOfRainbow"/.test(html));
  });

  it('Must use the nonce for the script and in the policy', () => {
    const html = renderPanelHtml(toggles, [], rows, 'n0nce', 'vscode-resource:', '');
    assert.ok(html.includes('<script nonce="n0nce"'));
    assert.ok(html.includes("script-src 'nonce-n0nce'"));
  });

  it('Must deny every default source in the policy', () => {
    const html = renderPanelHtml(toggles, [], rows, 'n0nce', 'vscode-resource:', '');
    assert.ok(html.includes("default-src 'none'"));
  });

  it('Must show the saved color of a row', () => {
    const html = renderPanelHtml(toggles, [], rows, 'n0nce', 'vscode-resource:', '');
    assert.ok(html.includes('#8888ff'));
  });

  it('Must escape a saved color that looks like markup', () => {
    const html = renderPanelHtml(
      toggles,
      [],
      [{ key: 'foreground', label: 'Inactive line number', values: inWorkspace('<img onerror=x>') }],
      'n0nce',
      'vscode-resource:',
      ''
    );
    assert.ok(!html.includes('<img'));
  });

  it('Must offer both scopes and an apply button per row', () => {
    const html = renderPanelHtml(toggles, [], rows, 'n0nce', 'vscode-resource:', '');
    assert.ok(html.includes('value="workspace"'));
    assert.ok(html.includes('value="user"'));
    assert.ok(html.includes('data-apply="centerColorOfRainbow"'));
    assert.ok(html.includes('data-apply="foreground"'));
  });

  it('Must leave an off toggle unchecked', () => {
    const html = renderPanelHtml(
      [{ key: 'enableRainbow', label: 'Rainbow', values: inWorkspace(false) }],
      [],
      rows,
      'n0nce',
      'vscode-resource:',
      ''
    );
    const input = /<input type="checkbox"[^>]*data-toggle="enableRainbow"[^>]*>/.exec(html);
    assert.ok(input, 'no checkbox for enableRainbow');
    assert.ok(!(input as RegExpExecArray)[0].includes('checked'));
  });

  it('Must check a toggle that is on', () => {
    const html = renderPanelHtml(
      [{ key: 'enableRainbow', label: 'Rainbow', values: inWorkspace(true) }],
      [],
      rows,
      'n0nce',
      'vscode-resource:',
      ''
    );
    const input = /<input type="checkbox"[^>]*data-toggle="enableRainbow"[^>]*>/.exec(html);
    assert.ok(input, 'no checkbox for enableRainbow');
    assert.ok((input as RegExpExecArray)[0].includes('checked'));
  });

  it('Must draw every toggle above the color rows', () => {
    const html = renderPanelHtml(toggles, [], rows, 'n0nce', 'vscode-resource:', '');
    const firstColor = html.indexOf('data-key=');
    for (const toggle of toggles) {
      const at = html.indexOf(`data-toggle="${toggle.key}"`);
      assert.ok(at >= 0, `resolved panel html has no toggle for ${toggle.key}`);
      assert.ok(at < firstColor, `the toggle for ${toggle.key} is not above the colors`);
    }
  });

  it('Must escape a toggle label that looks like markup', () => {
    const html = renderPanelHtml(
      [{ key: 'enableRainbow', label: '<b>x</b>', values: inWorkspace(false) }],
      [],
      rows,
      'n0nce',
      'vscode-resource:',
      ''
    );
    assert.ok(!html.includes('<b>'));
  });

  it('Must offer an apply button per toggle row', () => {
    const html = renderPanelHtml(toggles, [], rows, 'n0nce', 'vscode-resource:', '');
    assert.ok(html.includes('data-apply-toggle="enableRainbow"'));
  });

  it('Must offer exactly one apply all control', () => {
    const html = renderPanelHtml(toggles, [], rows, 'n0nce', 'vscode-resource:', '');
    const occurrences = html.split('data-apply-all=').length - 1;
    assert.strictEqual(occurrences, 1);
  });

  it('Must draw the apply all control below the color rows', () => {
    const html = renderPanelHtml(toggles, [], rows, 'n0nce', 'vscode-resource:', '');
    const lastApply = html.lastIndexOf('data-apply=');
    const applyAll = html.indexOf('data-apply-all=');
    assert.ok(lastApply >= 0, 'no color row apply button');
    assert.ok(applyAll > lastApply, 'the apply all control is not below the colors');
  });

  it('Must offer an hsl and an rgb slider per component of a color row', () => {
    const html = renderPanelHtml(toggles, [], rows, 'n0nce', 'vscode-resource:', '');
    for (const component of ['h', 's', 'l', 'r', 'g', 'b']) {
      const slider = new RegExp(
        '<input[^>]*data-slider-for="centerColorOfRainbow"[^>]*data-slider="' + component + '"'
      );
      assert.ok(slider.test(html), `no ${component} slider for centerColorOfRainbow`);
    }
  });

  it('Must hold the sliders of a color row inside a details element', () => {
    const html = renderPanelHtml(toggles, [], rows, 'n0nce', 'vscode-resource:', '');
    const details = html.indexOf('<details');
    const slider = html.indexOf('data-slider-for="centerColorOfRainbow"');
    assert.ok(details >= 0, 'no details element');
    assert.ok(details < slider, 'the sliders are not inside a details element');
  });

  it('Must offer both mode tabs for a color row', () => {
    const html = renderPanelHtml(toggles, [], rows, 'n0nce', 'vscode-resource:', '');
    assert.ok(html.includes('data-mode-tab="hsl"'));
    assert.ok(html.includes('data-mode-tab="rgb"'));
  });

  it('Must inline the conversion library inside the nonced script', () => {
    const html = renderPanelHtml(
      toggles,
      [],
      rows,
      'n0nce',
      'vscode-resource:',
      'INLINE_LIB_SENTINEL_9f3c'
    );
    const script = html.indexOf('<script nonce="n0nce"');
    const sentinel = html.indexOf('INLINE_LIB_SENTINEL_9f3c');
    assert.ok(script >= 0, 'no nonced script block');
    assert.ok(sentinel > script, 'the library is not inside the nonced script');
    assert.ok(html.indexOf('</script>', sentinel) > sentinel, 'the library escapes the script');
  });

  it('Must leave the inlined library unescaped so it can run', () => {
    const html = renderPanelHtml(toggles, [], rows, 'n0nce', 'vscode-resource:', 'INLINE<LIB');
    assert.ok(html.includes('INLINE<LIB'), 'the inlined library was html-escaped');
  });

  it('Must offer a hex text field carrying the saved color of a row', () => {
    const html = renderPanelHtml(toggles, [], rows, 'n0nce', 'vscode-resource:', '');
    const field = /<input[^>]*data-hex-for="centerColorOfRainbow"[^>]*>/.exec(html);
    assert.ok(field, 'no hex field for centerColorOfRainbow');
    assert.ok(
      (field as RegExpExecArray)[0].includes('value="#8888ff"'),
      'the hex field does not carry the saved color'
    );
  });

  it('Must offer a picking plane with a marker per color row', () => {
    const html = renderPanelHtml(toggles, [], rows, 'n0nce', 'vscode-resource:', '');
    assert.ok(
      html.includes('data-plane-for="centerColorOfRainbow"'),
      'no picking plane for centerColorOfRainbow'
    );
    assert.ok(
      html.includes('data-plane-marker="centerColorOfRainbow"'),
      'the picking plane has no marker'
    );
  });

  it('Must draw the picking plane inside the details above the mode tabs', () => {
    const html = renderPanelHtml(toggles, [], rows, 'n0nce', 'vscode-resource:', '');
    const details = html.indexOf('<details');
    const plane = html.indexOf('data-plane-for="centerColorOfRainbow"');
    const tabs = html.indexOf('data-mode-tab="hsl"');
    assert.ok(details >= 0, 'no details element');
    assert.ok(details < plane, 'the picking plane is not inside the details element');
    assert.ok(plane < tabs, 'the picking plane is not above the mode tabs');
  });

  it('Must offer a reset control drawn as an inline svg per color row', () => {
    const html = renderPanelHtml(toggles, [], rows, 'n0nce', 'vscode-resource:', '');
    const reset = /data-reset="centerColorOfRainbow"[\s\S]*?<\/button>/.exec(html);
    assert.ok(reset, 'no reset control for centerColorOfRainbow');
    assert.ok(
      (reset as RegExpExecArray)[0].includes('<svg'),
      'the reset control carries no inline svg glyph'
    );
  });

  it('Must offer exactly one reset all control beside apply all', () => {
    const html = renderPanelHtml(toggles, [], rows, 'n0nce', 'vscode-resource:', '');
    assert.ok(html.includes('data-reset-all='), 'no reset all control');
    assert.ok(html.includes('data-apply-all='), 'no apply all control');
    assert.strictEqual(html.split('data-reset-all=').length - 1, 1);
  });

  it('Must escape a saved color that looks like markup in the hex field', () => {
    const html = renderPanelHtml(
      toggles,
      [],
      [{ key: 'foreground', label: 'Inactive line number', values: inWorkspace('"><svg onload=x>') }],
      'n0nce',
      'vscode-resource:',
      ''
    );
    assert.ok(!html.includes('<svg onload'), 'the saved color escaped the hex field');
  });

  it('Must offer one option element per select value', () => {
    const html = renderPanelHtml(toggles, sel, rows, 'n0nce', 'vscode-resource:', '');
    for (const value of ['on', 'off', 'relative', 'interval']) {
      const option = new RegExp(
        '<[a-z]+[^>]*data-select-for="editor.lineNumbers"[^>]*data-value="' + value + '"'
      );
      assert.ok(option.test(html), `no option for ${value}`);
    }
  });

  it('Must mark exactly the current option of a select', () => {
    const html = renderPanelHtml(toggles, sel, rows, 'n0nce', 'vscode-resource:', '');
    const relative = new RegExp(
      '<[a-z]+[^>]*data-select-for="editor.lineNumbers"[^>]*data-value="relative"[^>]*>'
    ).exec(html);
    const on = new RegExp(
      '<[a-z]+[^>]*data-select-for="editor.lineNumbers"[^>]*data-value="on"[^>]*>'
    ).exec(html);
    assert.ok(relative, 'no relative option');
    assert.ok(on, 'no on option');
    assert.ok(
      (relative as RegExpExecArray)[0].includes('data-current="true"'),
      'the current option is not marked'
    );
    assert.ok(
      !(on as RegExpExecArray)[0].includes('data-current="true"'),
      'an option that is not current is marked'
    );
  });

  it('Must draw the select rows between the toggles and the color rows', () => {
    const html = renderPanelHtml(toggles, sel, rows, 'n0nce', 'vscode-resource:', '');
    const lastToggle = html.lastIndexOf('data-toggle=');
    const firstSelect = html.indexOf('data-select-for=');
    const firstColor = html.indexOf('data-key=');
    assert.ok(lastToggle >= 0, 'no toggle');
    assert.ok(firstSelect > lastToggle, 'the selects are not below the toggles');
    assert.ok(firstSelect < firstColor, 'the selects are not above the color rows');
  });

  it('Must offer an apply and a reset control per select row', () => {
    const html = renderPanelHtml(toggles, sel, rows, 'n0nce', 'vscode-resource:', '');
    assert.ok(html.includes('data-apply="editor.lineNumbers"'), 'no apply for the select row');
    assert.ok(html.includes('data-reset="editor.lineNumbers"'), 'no reset for the select row');
  });

  it('Must escape a select value that looks like markup', () => {
    const html = renderPanelHtml(
      toggles,
      [
        {
          key: 'editor.lineNumbers',
          label: 'Built-in line numbers',
          values: inWorkspace('"><img'),
          options: ['on', 'off', 'relative', 'interval'],
        },
      ],
      rows,
      'n0nce',
      'vscode-resource:',
      ''
    );
    assert.ok(!html.includes('<img'), 'the select value escaped its attribute');
  });
});

/** The opening tag of one row, where its scope marks are written. */
function rowTag(html: string, key: string): string {
  const tag = new RegExp('<div class="[^"]*"[^>]*data-row="' + key + '"[^>]*>').exec(html);
  assert.ok(tag, `no row for ${key}`);
  return (tag as RegExpExecArray)[0];
}

/** Everything one row renders, from its opening tag to the next row or section. */
function rowMarkup(html: string, key: string): string {
  const at = html.indexOf(`data-row="${key}"`);
  assert.ok(at >= 0, `no row for ${key}`);
  const next = html.indexOf('data-row="', at + 1);
  return html.slice(at, next === -1 ? html.indexOf('<div class="footer"', at) : next);
}

describe('Test the panel shows which scope a value comes from', () => {
  it('W1 Must name the workspace as the source of a workspace value', () => {
    const html = renderPanelHtml(
      toggles,
      [],
      [{ key: 'foreground', label: 'Inactive line number', values: inWorkspace('#123456') }],
      'n0nce',
      'vscode-resource:',
      ''
    );
    const tag = rowTag(html, 'foreground');
    assert.ok(tag.includes('data-source="workspace"'), `the row does not name its source: ${tag}`);
    assert.ok(!/\bclass="[^"]*\binherited\b/.test(tag), `a workspace value is dimmed: ${tag}`);
  });

  it('W2 Must mark a user value as inherited in the workspace view', () => {
    const html = renderPanelHtml(
      toggles,
      [],
      [{ key: 'foreground', label: 'Inactive line number', values: inUser('#abcdef') }],
      'n0nce',
      'vscode-resource:',
      ''
    );
    const tag = rowTag(html, 'foreground');
    assert.ok(tag.includes('data-source="user"'), `the row does not name the user scope: ${tag}`);
    assert.ok(
      /\bclass="[^"]*\binherited\b/.test(tag),
      `an inherited value is not marked inherited: ${tag}`
    );
  });

  it('W3 Must name the source in words beside the label', () => {
    const inherited = renderPanelHtml(
      toggles,
      [],
      [{ key: 'foreground', label: 'Inactive line number', values: inUser('#abcdef') }],
      'n0nce',
      'vscode-resource:',
      ''
    );
    assert.ok(
      rowMarkup(inherited, 'foreground').includes('from user'),
      'the inherited row does not say where its value comes from'
    );
    const nothing = renderPanelHtml(
      toggles,
      [],
      [{ key: 'foreground', label: 'Inactive line number', values: unset<string>() }],
      'n0nce',
      'vscode-resource:',
      ''
    );
    assert.ok(
      rowMarkup(nothing, 'foreground').includes('not set'),
      'a row holding no value anywhere does not say so'
    );
  });

  it('W4 Must name the source of a toggle row and of a select row too', () => {
    const html = renderPanelHtml(
      [{ key: 'enableRainbow', label: 'Rainbow', values: inUser(true) }],
      sel,
      rows,
      'n0nce',
      'vscode-resource:',
      ''
    );
    assert.ok(
      rowTag(html, 'enableRainbow').includes('data-source="user"'),
      'the toggle row does not name its source'
    );
    assert.ok(
      rowTag(html, 'editor.lineNumbers').includes('data-source="workspace"'),
      'the select row does not name its source'
    );
  });
});
