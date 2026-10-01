import * as assert from 'assert';
import * as vscode from 'vscode';
import {
	getMultiplesOfFiveLineNumberColor,
	getRepeatingDigitsLineNumberColor,
	getSequentialDigitsLineNumberColor,
	nameOfExtension,
} from '../../config';

const vsCodeGlobal = vscode.ConfigurationTarget.Global as vscode.ConfigurationTarget;

const cases: { key: string; themeColorId: string; getter: () => unknown }[] = [
	{
		key: 'foregroundColorOfRepeatingDigits',
		themeColorId: 'LineNumberDeco.repeatingDigitsForeground',
		getter: getRepeatingDigitsLineNumberColor,
	},
	{
		key: 'foregroundColorOfSequentialDigits',
		themeColorId: 'LineNumberDeco.sequentialDigitsForeground',
		getter: getSequentialDigitsLineNumberColor,
	},
	{
		key: 'foregroundColorOfMultiplesOfFive',
		themeColorId: 'LineNumberDeco.multiplesOfFiveForeground',
		getter: getMultiplesOfFiveLineNumberColor,
	},
];

suite('Highlight colors resolve through the theme', () => {
	const saved = new Map<string, string | undefined>();

	suiteSetup(() => {
		const config = vscode.workspace.getConfiguration(nameOfExtension);
		for (const { key } of cases) {
			saved.set(key, config.inspect<string>(key)?.globalValue);
		}
	});

	suiteTeardown(async () => {
		const config = vscode.workspace.getConfiguration(nameOfExtension);
		for (const { key } of cases) {
			await config.update(key, saved.get(key), vsCodeGlobal);
		}
	});

	for (const { key, themeColorId, getter } of cases) {
		test(`An empty ${key} resolves to the theme color ${themeColorId}`, async () => {
			await vscode.workspace.getConfiguration(nameOfExtension).update(key, '', vsCodeGlobal);
			const color = getter();
			assert.ok(color instanceof vscode.ThemeColor, `${key} gave ${String(color)}`);
			assert.strictEqual((color as vscode.ThemeColor).id, themeColorId);
		});

		test(`An explicit ${key} is used as written`, async () => {
			await vscode.workspace.getConfiguration(nameOfExtension).update(key, '#123456', vsCodeGlobal);
			assert.strictEqual(getter(), '#123456');
		});
	}
});
