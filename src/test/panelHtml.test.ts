import * as assert from 'assert';
import { describe, it } from 'mocha';
import { PanelRow, PanelToggle, renderPanelHtml } from '../panelHtml';

const rows: PanelRow[] = [
  { key: 'centerColorOfRainbow', label: 'Rainbow center', savedColor: '#8888ff' },
  { key: 'foreground', label: 'Inactive line number', savedColor: '' },
];

const toggles: PanelToggle[] = [
  { key: 'enableRelativeLine', label: 'Relative line numbers', value: true },
  { key: 'enableRainbow', label: 'Rainbow', value: false },
  { key: 'enableRepeatingDigits', label: 'Repeating digits', value: false },
  { key: 'enableSequentialDigits', label: 'Sequential digits', value: false },
];

describe('Test render the color panel html', () => {
  it('Must carry the row key on a color input', () => {
    const html = renderPanelHtml(toggles, rows, 'n0nce', 'vscode-resource:');
    assert.ok(/<input type="color"[^>]*data-key="centerColorOfRainbow"/.test(html));
  });

  it('Must use the nonce for the script and in the policy', () => {
    const html = renderPanelHtml(toggles, rows, 'n0nce', 'vscode-resource:');
    assert.ok(html.includes('<script nonce="n0nce"'));
    assert.ok(html.includes("script-src 'nonce-n0nce'"));
  });

  it('Must deny every default source in the policy', () => {
    const html = renderPanelHtml(toggles, rows, 'n0nce', 'vscode-resource:');
    assert.ok(html.includes("default-src 'none'"));
  });

  it('Must show the saved color of a row', () => {
    const html = renderPanelHtml(toggles, rows, 'n0nce', 'vscode-resource:');
    assert.ok(html.includes('#8888ff'));
  });

  it('Must escape a saved color that looks like markup', () => {
    const html = renderPanelHtml(
      toggles,
      [{ key: 'foreground', label: 'Inactive line number', savedColor: '<img onerror=x>' }],
      'n0nce',
      'vscode-resource:'
    );
    assert.ok(!html.includes('<img'));
  });

  it('Must offer both scopes and an apply button per row', () => {
    const html = renderPanelHtml(toggles, rows, 'n0nce', 'vscode-resource:');
    assert.ok(html.includes('value="workspace"'));
    assert.ok(html.includes('value="user"'));
    assert.ok(html.includes('data-apply="centerColorOfRainbow"'));
    assert.ok(html.includes('data-apply="foreground"'));
  });

  it('Must leave an off toggle unchecked', () => {
    const html = renderPanelHtml(
      [{ key: 'enableRainbow', label: 'Rainbow', value: false }],
      rows,
      'n0nce',
      'vscode-resource:'
    );
    const input = /<input type="checkbox"[^>]*data-toggle="enableRainbow"[^>]*>/.exec(html);
    assert.ok(input, 'no checkbox for enableRainbow');
    assert.ok(!(input as RegExpExecArray)[0].includes('checked'));
  });

  it('Must check a toggle that is on', () => {
    const html = renderPanelHtml(
      [{ key: 'enableRainbow', label: 'Rainbow', value: true }],
      rows,
      'n0nce',
      'vscode-resource:'
    );
    const input = /<input type="checkbox"[^>]*data-toggle="enableRainbow"[^>]*>/.exec(html);
    assert.ok(input, 'no checkbox for enableRainbow');
    assert.ok((input as RegExpExecArray)[0].includes('checked'));
  });

  it('Must draw every toggle above the color rows', () => {
    const html = renderPanelHtml(toggles, rows, 'n0nce', 'vscode-resource:');
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
      rows,
      'n0nce',
      'vscode-resource:'
    );
    assert.ok(!html.includes('<b>'));
  });
});