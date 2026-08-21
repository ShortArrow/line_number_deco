import * as assert from 'assert';
import { describe, it } from 'mocha';
import { throttleTrailing } from '../throttle';

function fakeHost() {
  let now = 0;
  let pending: { at: number; cb: () => void } | undefined;
  return {
    host: {
      now: () => now,
      setTimeout: (cb: () => void, ms: number) => { pending = { at: now + ms, cb }; return pending; },
      clearTimeout: () => { pending = undefined; },
    },
    advance(to: number) {
      while (pending && pending.at <= to) { const p = pending; pending = undefined; now = p.at; p.cb(); }
      now = to;
    },
  };
}

describe('Test leading-plus-trailing throttle', () => {
  it('Must run the first call in a quiet period immediately', () => {
    const { host } = fakeHost();
    const calls: string[] = [];
    const throttled = throttleTrailing((value: string) => { calls.push(value); }, 50, host);

    throttled('a');

    assert.deepStrictEqual(calls, ['a']);
  });

  it('Must defer a call inside the window to the trailing edge', () => {
    const { host, advance } = fakeHost();
    const calls: string[] = [];
    const throttled = throttleTrailing((value: string) => { calls.push(value); }, 50, host);

    throttled('a');
    advance(10);
    throttled('b');

    assert.deepStrictEqual(calls, ['a']);

    advance(50);

    assert.deepStrictEqual(calls, ['a', 'b']);
  });

  it('Must coalesce a burst into one trailing run with the latest arguments', () => {
    const { host, advance } = fakeHost();
    const calls: string[] = [];
    const throttled = throttleTrailing((value: string) => { calls.push(value); }, 50, host);

    throttled('a');
    advance(10);
    throttled('b');
    advance(20);
    throttled('c');
    advance(50);

    assert.deepStrictEqual(calls, ['a', 'c']);
  });

  it('Must run immediately again once the window has elapsed', () => {
    const { host, advance } = fakeHost();
    const calls: string[] = [];
    const throttled = throttleTrailing((value: string) => { calls.push(value); }, 50, host);

    throttled('a');
    advance(60);
    throttled('b');

    assert.deepStrictEqual(calls, ['a', 'b']);
  });

  it('Must re-anchor the window at the trailing run', () => {
    const { host, advance } = fakeHost();
    const calls: string[] = [];
    const throttled = throttleTrailing((value: string) => { calls.push(value); }, 50, host);

    throttled('a');
    advance(10);
    throttled('b');
    advance(60);
    throttled('c');

    assert.deepStrictEqual(calls, ['a', 'b']);

    advance(100);

    assert.deepStrictEqual(calls, ['a', 'b', 'c']);
  });
});
