import * as assert from 'assert';
import { describe, it } from 'mocha';
import { PanelRow, PanelSelect, PanelToggle, renderPanelHtml } from '../panelHtml';

const rows: PanelRow[] = [
  { key: 'centerColorOfRainbow', label: 'Rainbow center', savedColor: '#8888ff' },
  { key: 'foreground', label: 'Inactive line number', savedColor: '' },
];

const sel: PanelSelect[] = [
  {
    key: 'editor.lineNumbers',
    label: 'Built-in line numbers',
    value: 'relative',
    options: ['on', 'off', 'relative', 'interval'],
  },
];

const toggles: PanelToggle[] = [
  { key: 'enableRelativeLine', label: 'Relative line numbers', value: true },
  { key: 'enableRainbow', label: 'Rainbow', value: false },
  { key: 'enableRepeatingDigits', label: 'Repeating digits', value: false },
  { key: 'enableSequentialDigits', label: 'Sequential digits', value: false },
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
      [{ key: 'foreground', label: 'Inactive line number', savedColor: '<img onerror=x>' }],
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
      [{ key: 'enableRainbow', label: 'Rainbow', value: false }],
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
      [{ key: 'enableRainbow', label: 'Rainbow', value: true }],
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
      [{ key: 'enableRainbow', label: '<b>x</b>', value: false }],
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
      [{ key: 'foreground', label: 'Inactive line number', savedColor: '"><svg onload=x>' }],
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
          value: '"><img',
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
