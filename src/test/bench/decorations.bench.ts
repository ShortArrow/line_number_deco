import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';
import * as vscode from 'vscode';
import {
	editorVisibleLineIndexes,
	readDecorationSettings,
	readDiagnosticMarks,
	toDecorationOptions,
	updateRelativeLineNumbers,
} from '../../core';
import { buildLineDecorationSpecs } from '../../decorations';

const extensionName = 'LineNumberDeco';
const lineCount = 5000;
const diagnosticCount = 500;
const warmupCalls = 50;
const measuredCalls = 500;
const cursorSwing = 20;
const toggles = [
	'enableRelativeLine',
	'enableRainbow',
	'enableRepeatingDigits',
	'enableSequentialDigits',
	'enableMultiplesOfFive',
	'enableDiagnostics',
] as const;

interface Stats { medianUs: number; p95Us: number; meanUs: number }
interface ScenarioResult {
	scenario: string;
	visibleLines: number;
	diagnosticsOnDocument: number;
	phases: Record<string, Stats>;
}

function sampleLine(i: number): string {
	switch (i % 7) {
		case 0: return `export function fn${i}(a: number, b: string): string {`;
		case 1: return `  const value${i} = a * ${i} + b.length; // compute`;
		case 2: return `  if (value${i} > ${i % 97}) { return b.repeat(${i % 5}); }`;
		case 3: return '';
		case 4: return `  /** doc for ${i} - ${'x'.repeat(i % 60)} */`;
		case 5: return `  return a.toString() + b + ${i};`;
		default: return '}';
	}
}

function stats(samplesMs: number[]): Stats {
	const sorted = [...samplesMs].sort((a, b) => a - b);
	const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1)];
	const mean = sorted.reduce((s, x) => s + x, 0) / sorted.length;
	const us = (ms: number) => Math.round(ms * 1000 * 10) / 10;
	return { medianUs: us(at(0.5)), p95Us: us(at(0.95)), meanUs: us(mean) };
}

/**
 * Time `body` over warm-up plus measured calls, moving the cursor one line
 * (within a fixed swing that stays on screen) before every call, untimed.
 */
function measure(editor: vscode.TextEditor, anchor: number, body: () => unknown): Stats {
	const samples: number[] = [];
	const sink: unknown[] = [];
	for (let i = 0; i < warmupCalls + measuredCalls; i++) {
		const line = anchor + (i % cursorSwing);
		editor.selection = new vscode.Selection(line, 0, line, 0);
		const start = performance.now();
		const result = body();
		const elapsed = performance.now() - start;
		sink[i % 2] = result;
		if (i >= warmupCalls) {
			samples.push(elapsed);
		}
	}
	return stats(samples);
}

async function waitFor(condition: () => boolean, timeoutMs: number): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	while (!condition()) {
		if (Date.now() > deadline) {
			throw new Error('timed out waiting for the editor to settle');
		}
		await new Promise(r => setTimeout(r, 50));
	}
}

async function setToggles(values: Record<string, boolean | undefined>) {
	const config = vscode.workspace.getConfiguration(extensionName);
	for (const key of toggles) {
		await config.update(key, values[key], vscode.ConfigurationTarget.Global);
	}
}

function runScenario(
	name: string,
	editor: vscode.TextEditor,
	decorationType: vscode.TextEditorDecorationType,
	anchor: number
): ScenarioResult {
	const document = editor.document;
	const labelWidth = document.lineCount.toString().length;
	const lineIndexes = editorVisibleLineIndexes(editor);
	const settings = readDecorationSettings(editor);
	const marks = readDiagnosticMarks(document.uri);
	const rainbowOff = { ...settings, enableRainbow: false };
	const rainbowOn = { ...settings, enableRainbow: true };
	const specs = buildLineDecorationSpecs(lineIndexes, settings, marks);
	const prebuilt = toDecorationOptions(specs, document, labelWidth);

	const phases: Record<string, Stats> = {
		fullUpdate: measure(editor, anchor, () => updateRelativeLineNumbers(editor, decorationType)),
		readDecorationSettings: measure(editor, anchor, () => readDecorationSettings(editor)),
		readDiagnosticMarks: measure(editor, anchor, () => readDiagnosticMarks(document.uri)),
		visibleLineIndexes: measure(editor, anchor, () => editorVisibleLineIndexes(editor)),
		buildSpecsAsConfigured: measure(editor, anchor, () => buildLineDecorationSpecs(lineIndexes, settings, marks)),
		buildSpecsRainbowOn: measure(editor, anchor, () => buildLineDecorationSpecs(lineIndexes, rainbowOn, marks)),
		buildSpecsRainbowOff: measure(editor, anchor, () => buildLineDecorationSpecs(lineIndexes, rainbowOff, marks)),
		toDecorationOptions: measure(editor, anchor, () => toDecorationOptions(specs, document, labelWidth)),
		setDecorations: measure(editor, anchor, () => editor.setDecorations(decorationType, prebuilt)),
	};
	return {
		scenario: name,
		visibleLines: lineIndexes.length,
		diagnosticsOnDocument: vscode.languages.getDiagnostics(document.uri).length,
		phases,
	};
}

function printTable(result: ScenarioResult) {
	const full = result.phases.fullUpdate.medianUs;
	const rows = Object.entries(result.phases).map(([phase, s]) =>
		`| ${phase.padEnd(24)} | ${s.medianUs.toFixed(1).padStart(9)} | ${s.p95Us.toFixed(1).padStart(9)} | ${s.meanUs.toFixed(1).padStart(9)} | ${((s.medianUs / full) * 100).toFixed(0).padStart(6)}% |`);
	console.log([
		'',
		`### ${result.scenario} - visible lines: ${result.visibleLines}, diagnostics on document: ${result.diagnosticsOnDocument}`,
		`| ${'phase'.padEnd(24)} | median us | p95 us    | mean us   | %full   |`,
		`|${'-'.repeat(26)}|-----------|-----------|-----------|---------|`,
		...rows,
	].join('\n'));
}

suite('Decoration update cost', () => {
	test('per-update cost of each phase', async () => {
		const config = vscode.workspace.getConfiguration(extensionName);
		const previous: Record<string, boolean | undefined> = {};
		for (const key of toggles) {
			previous[key] = config.inspect<boolean>(key)?.globalValue;
		}
		// The built-in TypeScript server cannot be disabled from the command line;
		// its own diagnostics would otherwise outnumber the controlled ones.
		const typescriptConfig = vscode.workspace.getConfiguration('typescript');
		const previousValidate = typescriptConfig.inspect<boolean>('validate.enable')?.globalValue;
		await typescriptConfig.update('validate.enable', false, vscode.ConfigurationTarget.Global);

		const content = Array.from({ length: lineCount }, (_, i) => sampleLine(i)).join('\n');
		const document = await vscode.workspace.openTextDocument({ language: 'typescript', content });
		const editor = await vscode.window.showTextDocument(document);
		const middle = Math.floor(lineCount / 2);
		editor.revealRange(new vscode.Range(middle, 0, middle, 0), vscode.TextEditorRevealType.AtTop);
		await waitFor(() => editor.visibleRanges.length > 0 && editor.visibleRanges[0].start.line >= middle - 5, 10000);
		const anchor = editor.visibleRanges[0].start.line + 2;

		const collection = vscode.languages.createDiagnosticCollection('bench');
		collection.set(document.uri, Array.from({ length: diagnosticCount }, (_, i) => {
			const line = Math.floor((i * lineCount) / diagnosticCount) + (i % 3);
			return new vscode.Diagnostic(
				new vscode.Range(line, 0, line, 1),
				`bench ${i}`,
				i % 2 === 0 ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning
			);
		}));
		const decorationType = vscode.window.createTextEditorDecorationType({});

		const results: ScenarioResult[] = [];
		try {
			await setToggles(Object.fromEntries(toggles.map(k => [k, true])));
			results.push(runScenario('all features on', editor, decorationType, anchor));
			await setToggles({ ...Object.fromEntries(toggles.map(k => [k, false])), enableRelativeLine: true });
			results.push(runScenario('relative numbers only', editor, decorationType, anchor));
		} finally {
			await setToggles(previous);
			await typescriptConfig.update('validate.enable', previousValidate, vscode.ConfigurationTarget.Global);
			collection.dispose();
			decorationType.dispose();
		}

		const bySource: Record<string, number> = {};
		for (const d of vscode.languages.getDiagnostics(document.uri)) {
			bySource[d.source ?? '(none)'] = (bySource[d.source ?? '(none)'] ?? 0) + 1;
		}
		console.log(`\ndiagnostics from other sources after the run: ${JSON.stringify(bySource)}`);
		console.log(`\nVS Code ${vscode.version}, extension host node ${process.version}, ${warmupCalls} warm-up + ${measuredCalls} measured calls per row`);
		results.forEach(printTable);
		const outFile = path.resolve(__dirname, '../../bench-results.json');
		fs.writeFileSync(outFile, JSON.stringify({
			vscodeVersion: vscode.version,
			node: process.version,
			warmupCalls,
			measuredCalls,
			results,
		}, null, 2));
		console.log(`\nwritten to ${outFile}`);
	});
});
