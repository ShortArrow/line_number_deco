/**
 * Wrap an async handler so that items are handled one at a time, in the order
 * they arrive, through a single promise chain.
 *
 * An item's handler starts only once the handler of the item before it has
 * settled. A handler that rejects is reported through `onError` and does not
 * stop the items after it.
 *
 * @param handle what to do with one item
 * @param onError told about every handler that rejected
 * @returns a function that queues one item and resolves once it has been handled
 */
export function serially<T>(
  handle: (item: T) => Promise<void>,
  onError: (error: unknown) => void
): (item: T) => Promise<void> {
  let tail: Promise<void> = Promise.resolve();
  return (item) => {
    tail = tail.then(() => handle(item)).catch(onError);
    return tail;
  };
}
