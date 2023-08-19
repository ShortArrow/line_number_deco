import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { colorCodeFromHsl } from '../colors';

suite('Colors Test', () => {
	test('Sample hue', () => {
		assert.strictEqual(colorCodeFromHsl(0, 1, 0.5), '#ff0000');
		assert.strictEqual(colorCodeFromHsl(60, 1, 0.5), '#ffff00');
	});
});
