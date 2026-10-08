import * as assert from 'assert';
import { describe, it } from 'mocha';
import { handlePanelMessage } from '../panel';
import { clearAllPreviews, getPendingPreviews } from '../preview';

// The invariants of docs/panel-staging.md, checked against handlePanelMessage
// alone: every message is handed over the moment it is clicked, without the
// provider's queue, so a save can still be in flight when the next message
// arrives and saves may settle in any order.

type Value = string | boolean;
type Scope = 'user' | 'workspace';

const colorKey = 'foreground';
const toggleKey = 'enableRainbow';
const selectKey = 'editor.lineNumbers';
const keys = [colorKey, toggleKey, selectKey];

const choices: Record<string, Value[]> = {
  [colorKey]: ['#111111', '#222222'],
  [toggleKey]: [true, false],
  [selectKey]: ['relative', 'off'],
};

/** What a row shows when nothing is saved or staged; a color shows nothing and cannot be applied. */
const defaults: Record<string, Value | undefined> = {
  [colorKey]: undefined,
  [toggleKey]: false,
  [selectKey]: 'on',
};

type Op =
  | { kind: 'stage'; key: string; value: Value }
  | { kind: 'apply'; key: string }
  | { kind: 'applyAll' }
  | { kind: 'reset'; key: string };

const alphabet: Op[] = [
  ...keys.flatMap((key) => choices[key].map((value): Op => ({ kind: 'stage', key, value }))),
  ...keys.map((key): Op => ({ kind: 'apply', key })),
  { kind: 'applyAll' },
  ...keys.map((key): Op => ({ kind: 'reset', key })),
];

function describeOp(op: Op): string {
  switch (op.kind) {
    case 'stage':
      return `stage ${op.key}=${op.value}`;
    case 'apply':
      return `apply ${op.key}`;
    case 'applyAll':
      return 'apply all';
    case 'reset':
      return `reset ${op.key}`;
  }
}

interface SaveCall {
  id: number;
  click: number;
  key: string;
  value: Value;
  scope: string;
  status: 'pending' | 'ok' | 'failed';
  settle(ok: boolean): void;
}

/** One click as the reference model saw it: what was staged and what was being saved at that moment. */
interface Click {
  op: Op;
  staged: Map<string, Value>;
  inFlight: Set<string>;
}

interface Snapshot {
  saved: Map<string, Value>;
  pending: Map<string, Value>;
}

interface Violation {
  invariant: string;
  detail: string;
}

/**
 * Let every handler run until it waits on a save that has not settled.
 *
 * A handler resumes through a few chained microtasks after its save settles;
 * draining a fixed number of them is exact and far cheaper than a macrotask
 * per step, which is what keeps a quarter of a million executions in seconds.
 */
async function flush(): Promise<void> {
  for (let tick = 0; tick < flushTicks; tick += 1) {
    await Promise.resolve();
  }
}

const flushTicks = 32;

function pendingNow(): Map<string, Value> {
  return new Map(getPendingPreviews().map((entry) => [entry.key, entry.value]));
}

function show(value: Value | undefined): string {
  return value === undefined ? 'nothing' : String(value);
}

/**
 * One execution: the extension under test, a fake configuration whose writes
 * settle only when the test says so, and the reference model beside it.
 */
class Run {
  readonly saved: Record<Scope, Map<string, Value>> = { user: new Map(), workspace: new Map() };
  readonly saves: SaveCall[] = [];
  readonly posts: Snapshot[] = [];
  readonly errors: string[] = [];
  readonly escaped: unknown[] = [];
  readonly saving = new Set<string>();
  readonly clicks: Click[] = [];
  readonly steps: string[] = [];
  readonly violations: Violation[] = [];
  /** The reference model's staged values. */
  readonly staged = new Map<string, Value>();

  constructor() {
    clearAllPreviews();
  }

  private depsFor(click: number) {
    return {
      isColorKey: (key: string) => key === colorKey,
      isToggleKey: (key: string) => key === toggleKey,
      isSelectKey: (key: string) => key === selectKey,
      isValidSelectValue: (key: string, value: string) =>
        key === selectKey && ['on', 'off', 'relative', 'interval'].includes(value),
      save: (key: string, value: Value, scope: string) =>
        new Promise<void>((resolve, reject) => {
          const call: SaveCall = {
            id: this.saves.length + 1,
            click,
            key,
            value,
            scope,
            status: 'pending',
            settle: (ok) => {
              if (ok) {
                this.saved[scope as Scope]?.set(key, value);
                call.status = 'ok';
                resolve();
              } else {
                call.status = 'failed';
                reject(new Error('disk full'));
              }
            },
          };
          this.saves.push(call);
        }),
      refresh: () => undefined,
      postState: () => {
        this.posts.push({ saved: new Map(this.saved.user), pending: pendingNow() });
      },
      showError: (message: string) => {
        this.errors.push(message);
      },
      saving: this.saving,
    };
  }

  pendingSaves(): SaveCall[] {
    return this.saves.filter((call) => call.status === 'pending');
  }

  /** What the row of a key shows: the staged value over the user value over the default. */
  private shown(key: string): Value | undefined {
    return this.staged.get(key) ?? this.saved.user.get(key) ?? defaults[key];
  }

  private messageFor(op: Op): object | undefined {
    switch (op.kind) {
      case 'stage':
        return op.key === toggleKey
          ? { type: 'previewToggle', key: op.key, value: op.value }
          : { type: 'preview', key: op.key, value: op.value };
      case 'apply': {
        const value = this.shown(op.key);
        if (value === undefined) {
          return undefined;
        }
        return op.key === toggleKey
          ? { type: 'applyToggle', key: op.key, value, scope: 'user' }
          : { type: 'apply', key: op.key, value, scope: 'user' };
      }
      case 'applyAll':
        return { type: 'applyAll', scope: 'user' };
      case 'reset':
        return { type: 'resetRow', key: op.key };
    }
  }

  async click(op: Op): Promise<void> {
    const index = this.clicks.length;
    this.clicks.push({
      op,
      staged: new Map(this.staged),
      inFlight: new Set(this.pendingSaves().map((call) => call.key)),
    });
    this.steps.push(describeOp(op));
    const message = this.messageFor(op);
    if (op.kind === 'stage') {
      this.staged.set(op.key, op.value);
    } else if (op.kind === 'reset') {
      this.staged.delete(op.key);
    }
    if (message) {
      handlePanelMessage(message, this.depsFor(index)).catch((error) => {
        this.escaped.push(error);
      });
    }
    await flush();
  }

  async settle(id: number, ok: boolean): Promise<void> {
    const call = this.saves[id - 1];
    this.steps.push(`save #${id} (${call.key}=${call.value}) ${ok ? 'resolves' : 'rejects'}`);
    const postsBefore = this.posts.length;
    call.settle(ok);
    if (ok && this.expected(call) && this.staged.get(call.key) === call.value) {
      this.staged.delete(call.key);
    }
    await flush();
    if (this.pendingSaves().length === 0) {
      this.checkFinalPost(postsBefore);
    }
  }

  /** Whether the reference model asked for this write: its click covered the key, staged at the value written. */
  private expected(call: SaveCall): boolean {
    const click = this.clicks[call.click];
    const covers =
      click.op.kind === 'applyAll' || (click.op.kind === 'apply' && click.op.key === call.key);
    return covers && click.staged.get(call.key) === call.value && call.scope === 'user';
  }

  /** After the last save settles, the webview must be told the state it settled to. */
  private checkFinalPost(postsBefore: number) {
    const last = this.posts[this.posts.length - 1];
    const pending = pendingNow();
    if (
      this.posts.length === postsBefore ||
      !sameMap(last.saved, this.saved.user) ||
      !sameMap(last.pending, pending)
    ) {
      this.violations.push({
        invariant: 'I5',
        detail: 'no state message carried the state the saves settled to',
      });
    }
  }

  /** Every invariant violated once all saves have settled. */
  check(): Violation[] {
    const found = [...this.violations];
    for (const call of this.saves) {
      const click = this.clicks[call.click];
      const covers =
        click.op.kind === 'applyAll' || (click.op.kind === 'apply' && click.op.key === call.key);
      const staged = click.staged.get(call.key);
      if (!covers || staged === undefined) {
        found.push({
          invariant: 'I2',
          detail: `save #${call.id} wrote ${call.key}=${call.value}, which was not staged when "${describeOp(click.op)}" was clicked`,
        });
      } else if (staged !== call.value || call.scope !== 'user') {
        found.push({
          invariant: 'I1',
          detail: `save #${call.id} wrote ${call.key}=${call.value} to ${call.scope}, but ${call.key} was ${show(staged)} when "${describeOp(click.op)}" was clicked for user`,
        });
      }
    }
    this.clicks.forEach((click, index) => {
      const targets =
        click.op.kind === 'apply'
          ? [click.op.key]
          : click.op.kind === 'applyAll'
            ? [...click.staged.keys()]
            : [];
      for (const key of targets) {
        if (!click.staged.has(key) || click.inFlight.has(key)) {
          continue;
        }
        const calls = this.saves.filter((call) => call.click === index && call.key === key);
        if (calls.length !== 1) {
          found.push({
            invariant: 'I1',
            detail: `"${describeOp(click.op)}" saved ${key} ${calls.length} times instead of once`,
          });
        }
      }
    });
    for (const key of keys) {
      const succeeded = this.saves.filter((call) => call.key === key && call.status === 'ok');
      const latest = succeeded.sort((a, b) => a.click - b.click || a.id - b.id).pop();
      if (latest && this.saved.user.get(key) !== latest.value) {
        found.push({
          invariant: 'I1',
          detail: `${key} ends saved as ${show(this.saved.user.get(key))}, but the last Apply that succeeded wrote ${latest.value}`,
        });
      }
    }
    const pending = pendingNow();
    for (const key of keys) {
      const expected = this.staged.get(key);
      const actual = pending.get(key);
      if (expected !== actual) {
        const failed = this.saves.some(
          (call) => call.key === key && call.status === 'failed' && call.value === expected
        );
        found.push({
          invariant: failed ? 'I4' : 'I3',
          detail: `${key} should be staged as ${show(expected)} but is staged as ${show(actual)}`,
        });
      }
    }
    for (const call of this.saves.filter((entry) => entry.status === 'failed')) {
      if (!this.errors.some((message) => message.includes(call.key))) {
        found.push({
          invariant: 'I4',
          detail: `save #${call.id} of ${call.key} failed and no error message named ${call.key}`,
        });
      }
    }
    for (const error of this.escaped) {
      found.push({ invariant: 'I4', detail: `a failed save escaped the handler: ${String(error)}` });
    }
    return found;
  }
}

function sameMap(a: Map<string, Value>, b: Map<string, Value>): boolean {
  return a.size === b.size && [...a].every(([key, value]) => b.get(key) === value);
}

/** The choices open at one point of an execution, in a fixed order. */
type Choice = { kind: 'op' } | { kind: 'settle'; id: number; ok: boolean };

function choicesOf(run: Run, opsLeft: number): Choice[] {
  const open: Choice[] = opsLeft > 0 ? [{ kind: 'op' }] : [];
  const pending = run.pendingSaves();
  for (const call of pending) {
    open.push({ kind: 'settle', id: call.id, ok: true });
  }
  const rejected = run.saves.some((call) => call.status === 'failed');
  if (!rejected) {
    for (const call of pending) {
      open.push({ kind: 'settle', id: call.id, ok: false });
    }
  }
  return open;
}

/**
 * Run one execution of a sequence, taking the choices a path names and the
 * first choice past its end.
 *
 * @returns the finished run, the choices taken, and how many were open at each step
 */
async function execute(ops: Op[], path: number[]) {
  const run = new Run();
  const taken: number[] = [];
  const widths: number[] = [];
  let next = 0;
  for (;;) {
    const open = choicesOf(run, ops.length - next);
    if (open.length === 0) {
      break;
    }
    const index = path[taken.length] ?? 0;
    taken.push(index);
    widths.push(open.length);
    const choice = open[index];
    if (choice.kind === 'op') {
      await run.click(ops[next]);
      next += 1;
    } else {
      await run.settle(choice.id, choice.ok);
    }
  }
  return { run, taken, widths };
}

/** The path after this one in depth-first order, or undefined when the tree is done. */
function nextPath(taken: number[], widths: number[]): number[] | undefined {
  for (let i = taken.length - 1; i >= 0; i -= 1) {
    if (taken[i] + 1 < widths[i]) {
      return [...taken.slice(0, i), taken[i] + 1];
    }
  }
  return undefined;
}

function* sequences(length: number): Generator<Op[]> {
  if (length === 0) {
    yield [];
    return;
  }
  for (const head of sequences(length - 1)) {
    for (const op of alphabet) {
      yield [...head, op];
    }
  }
}

interface Report {
  executions: number;
  failing: number;
  byInvariant: Map<string, number>;
  /** The first execution to break each invariant; shortest sequences run first, so it is a minimal one. */
  first: Map<string, { steps: string[]; violation: Violation }>;
}

/** Every execution of every sequence up to a length, shortest sequences first. */
async function explore(maxLength: number): Promise<Report> {
  const report: Report = { executions: 0, failing: 0, byInvariant: new Map(), first: new Map() };
  for (let length = 1; length <= maxLength; length += 1) {
    for (const ops of sequences(length)) {
      let path: number[] | undefined = [];
      while (path) {
        const { run, taken, widths } = await execute(ops, path);
        report.executions += 1;
        const violations = run.check();
        if (violations.length > 0) {
          report.failing += 1;
          for (const violation of violations) {
            if (!report.first.has(violation.invariant)) {
              report.first.set(violation.invariant, { steps: run.steps, violation });
            }
          }
          for (const invariant of new Set(violations.map((entry) => entry.invariant))) {
            report.byInvariant.set(invariant, (report.byInvariant.get(invariant) ?? 0) + 1);
          }
        }
        path = nextPath(taken, widths);
      }
    }
  }
  return report;
}

function formatReport(report: Report): string {
  const counts = [...report.byInvariant]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([invariant, count]) => `${invariant}: ${count}`)
    .join(', ');
  const lines = [
    `${report.failing} of ${report.executions} executions break an invariant (${counts})`,
  ];
  for (const [invariant, { steps, violation }] of [...report.first].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`first minimal counterexample to ${invariant}: ${steps.join(' → ')}`);
    lines.push(`  ${violation.detail}`);
  }
  return lines.join('\n');
}

describe('Test the panel staging model', () => {
  it('Must keep I1–I5 on every sequence of up to 4 operations, every order of saves, and every single rejected save', async function () {
    this.timeout(60000);
    const report = await explore(4);
    assert.strictEqual(report.failing, 0, formatReport(report));
  });

  it('Must keep a color staged during the save of Apply all', async () => {
    const run = new Run();
    await run.click({ kind: 'stage', key: toggleKey, value: true });
    await run.click({ kind: 'applyAll' });
    await run.click({ kind: 'stage', key: colorKey, value: '#111111' });
    await run.settle(1, true);
    assert.strictEqual(run.saved.user.get(toggleKey), true);
    assert.deepStrictEqual([...pendingNow()], [[colorKey, '#111111']]);
    assert.deepStrictEqual(run.check(), []);
  });

  it('Must keep a select staged again while its Apply is saving', async () => {
    const run = new Run();
    await run.click({ kind: 'stage', key: selectKey, value: 'relative' });
    await run.click({ kind: 'apply', key: selectKey });
    await run.click({ kind: 'stage', key: selectKey, value: 'off' });
    await run.settle(1, true);
    assert.strictEqual(run.saved.user.get(selectKey), 'relative');
    assert.deepStrictEqual([...pendingNow()], [[selectKey, 'off']]);
    assert.deepStrictEqual(run.check(), []);
  });

  it('Must leave a color staged when its Apply fails, so Apply all saves it', async () => {
    const run = new Run();
    await run.click({ kind: 'stage', key: colorKey, value: '#111111' });
    await run.click({ kind: 'apply', key: colorKey });
    await run.settle(1, false);
    assert.deepStrictEqual([...pendingNow()], [[colorKey, '#111111']]);
    assert.ok(run.errors.some((message) => message.includes(colorKey)), 'no error named the key');
    await run.click({ kind: 'applyAll' });
    assert.strictEqual(run.saves.length, 2, 'Apply all did not save the color left staged');
    await run.settle(2, true);
    assert.strictEqual(run.saved.user.get(colorKey), '#111111');
    assert.deepStrictEqual([...pendingNow()], []);
  });

  it('Must show neither row at its old value while a color and a switch are applied back to back', async () => {
    const run = new Run();
    await run.click({ kind: 'stage', key: colorKey, value: '#111111' });
    await run.click({ kind: 'stage', key: toggleKey, value: true });
    await run.click({ kind: 'apply', key: colorKey });
    await run.click({ kind: 'apply', key: toggleKey });
    await run.settle(2, true);
    await run.settle(1, true);
    run.posts.forEach((post, index) => {
      assert.strictEqual(post.pending.get(colorKey) ?? post.saved.get(colorKey), '#111111', `state message ${index + 1} showed the color at its old value`);
      assert.strictEqual(post.pending.get(toggleKey) ?? post.saved.get(toggleKey), true, `state message ${index + 1} showed the switch at its old value`);
    });
    assert.strictEqual(run.saved.user.get(colorKey), '#111111');
    assert.strictEqual(run.saved.user.get(toggleKey), true);
    assert.deepStrictEqual([...pendingNow()], []);
  });
});
