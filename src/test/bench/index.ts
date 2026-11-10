import * as path from 'path';
import * as Mocha from 'mocha';
import { globSync } from 'glob';

/** Mocha entry for the benchmark host; runs every *.bench.js under this folder. */
export function run(): Promise<void> {
	const mocha = new Mocha({
		ui: 'tdd',
		color: true,
		timeout: 0,
	});

	const benchRoot = path.resolve(__dirname);

	return new Promise((c, e) => {
		const files = globSync('**/**.bench.js', { cwd: benchRoot });
		files.forEach(f => mocha.addFile(path.resolve(benchRoot, f)));
		try {
			mocha.run(failures => {
				if (failures > 0) {
					e(new Error(`${failures} benchmarks failed.`));
				} else {
					c();
				}
			});
		} catch (err) {
			console.error(err);
			e(err);
		}
	});
}
