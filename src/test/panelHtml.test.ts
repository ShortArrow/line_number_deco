import * as assert from 'assert';
import { describe, it } from 'mocha';
import { PanelRow, renderPanelHtml } from '../panelHtml';

const rows: PanelRow[] = [
  { key: 'centerColorOfRainbow', label: 'Rainbow center', savedColor: '#8888ff' },
  { key: 'foreground', label: 'Inactive line number', savedColor: '' },
];

describe('Test render the color panel html', () => {
  it('Must carry the row key on a color input', () => {
    const html = renderPanelHtml(rows, 'n0nce', 'vscode-resource:');
    assert.ok(/<input type="color"[^>]*data-key="centerColorOfRainbow"/.test(html));
  });

  it('Must use the nonce for the script and in the policy', () => {
    const html = renderPanelHtml(rows, 'n0nce', 'vscode-resource:');
    assert.ok(html.includes('<script nonce="n0nce"'));
    assert.ok(html.includes("script-src 'nonce-n0nce'"));
  });

  it('Must deny every default source in the policy', () => {
    const html = renderPanelHtml(rows, 'n0nce', 'vscode-resource:');
    assert.ok(html.includes("default-src 'none'"));
  });

  it('Must show the saved color of a row', () => {
    const html = renderPanelHtml(rows, 'n0nce', 'vscode-resource:');
    assert.ok(html.includes('#8888ff'));
  });

  it('Must escape a saved color that looks like markup', () => {
    const html = renderPanelHtml(
      [{ key: 'foreground', label: 'Inactive line number', savedColor: '<img onerror=x>' }],
      'n0nce',
      'vscode-resource:'
    );
    assert.ok(!html.includes('<img'));
  });

  it('Must offer both scopes and an apply button per row', () => {
    const html = renderPanelHtml(rows, 'n0nce', 'vscode-resource:');
    assert.ok(html.includes('value="workspace"'));
    assert.ok(html.includes('value="user"'));
    assert.ok(html.includes('data-apply="centerColorOfRainbow"'));
    assert.ok(html.includes('data-apply="foreground"'));
  });
});
