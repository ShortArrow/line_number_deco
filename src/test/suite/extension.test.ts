import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { colorCodeFromHsl } from '../../colors';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});
	test("must config can edit",async () => {
		const vsCodeGlobal = vscode.ConfigurationTarget.Global as vscode.ConfigurationTarget;
		const extensionConfigs = vscode.workspace.getConfiguration("LineNumberDeco");
		await extensionConfigs.update("enableRainbow", true, vsCodeGlobal);
		const config = vscode.workspace.getConfiguration("LineNumberDeco");
		const actual = config.get<boolean>("enableRainbow");
		assert.equal(actual, true);	
	});
});
