import * as assert from 'assert';
import { describe, it } from 'mocha';
import { serially } from '../serially';

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

describe('Test serial handling', () => {
  it('Must not start the next item until the one before has finished', async () => {
    const started: number[] = [];
    const first = deferred();
    const run = serially<number>(async (item) => {
      started.push(item);
      if (item === 1) {
        await first.promise;
      }
    }, () => undefined);
    run(1);
    const second = run(2);
    await settle();
    assert.deepStrictEqual(started, [1]);
    first.resolve();
    await second;
    assert.deepStrictEqual(started, [1, 2]);
  });

  it('Must go on to the next item after one fails, and report the failure', async () => {
    const handled: number[] = [];
    const failures: unknown[] = [];
    const run = serially<number>(async (item) => {
      if (item === 1) {
        throw new Error('boom');
      }
      handled.push(item);
    }, (error) => failures.push(error));
    run(1);
    await run(2);
    assert.deepStrictEqual(handled, [2]);
    assert.strictEqual(failures.length, 1);
  });
});
