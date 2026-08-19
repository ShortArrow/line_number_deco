/**
 * Line indexes to decorate for a set of visible ranges.
 *
 * Each range contributes its own lines plus one padding line beyond its end
 * (the historical single-range behaviour, kept so scrolling never shows an
 * undecorated line at the viewport edge). Ranges may overlap; the result is
 * ascending and duplicate-free. Folded regions produce multiple ranges, which
 * is why every range is honoured rather than only the first (issue #32).
 */
export function visibleLineIndexes(
  ranges: readonly { startLine: number; endLine: number }[],
  lineCount: number
): number[] {
  const indexes = new Set<number>();
  for (const { startLine, endLine } of ranges) {
    const from = Math.max(0, startLine);
    const to = Math.min(lineCount, endLine + 2);
    for (let lineIndex = from; lineIndex < to; lineIndex++) {
      indexes.add(lineIndex);
    }
  }
  return [...indexes].sort((a, b) => a - b);
}
