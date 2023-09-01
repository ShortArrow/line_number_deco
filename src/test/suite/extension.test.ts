import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { colorCodeFromHsl } from '../../colors';
import { updateEnableRainbowForUser } from '../../ui';

const vsCodeGlobal = vscode.ConfigurationTarget.Global as vscode.ConfigurationTarget;
const vsCodeWorkspace = vscode.ConfigurationTarget.Workspace as vscode.ConfigurationTarget;
const extensionName = "LineNumberDeco";

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});
	test("Can write enableRainbow true",() => {
		const targetCofig = "enableRainbow";
		const config = vscode.workspace.getConfiguration(extensionName);
		config.update(targetCofig, true, vsCodeGlobal);
		const actual = config.get<boolean>(targetCofig);
		assert.equal(actual, true);	
	});
	// test("Can write enableRainbow false",async () => {
	// 	const targetCofig = "enableRainbow";
	// 	const config = vscode.workspace.getConfiguration(extensionName);
	// 	try {
	// 		await config.update(targetCofig, false, vsCodeGlobal);
	// 	} catch (error) {
	// 		console.log(error);
	// 	}
	// 	const actual = config.get<boolean>(targetCofig);
	// 	assert.equal(actual, false);	
	// });
	// test("must config can edit by updater", async () => {
	// 	const targetCofig = "enableRainbow";
	// 	await updateEnableRainbowForUser(true);
	// 	const config = vscode.workspace.getConfiguration(extensionName);
	// 	const actual = config.get<boolean>(targetCofig);
	// 	assert.equal(actual, true);	
	// });
});
