import * as path from 'path';

import { runTests } from '@vscode/test-electron';

async function main() {
	try {
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');
		const extensionTestsPath = path.resolve(__dirname, './bench/index');

		// Keeps installed extensions out of the measured host. Built-in ones stay
		// active regardless; the benchmark silences their diagnostics by setting.
		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: ['--disable-extensions'],
		});
	} catch (err) {
		console.error('Failed to run benchmark', err);
		process.exit(1);
	}
}

main();
