import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it } from 'mocha';
import * as vscode from 'vscode';

// The activity-bar icon carries the main icon's relative line numbers as marks
// above and below the "12", and they shrink with distance from it as the
// numbers in the main icon do: 12 > 1 > 2 > 3 on each side.

const extension = vscode.extensions.getExtension('ShortArrow.line-number-deco');

/** The vertical extent of an SVG path's outline, curves sampled along their length. */
export function pathHeight(d: string): number {
  const tokens = d.match(/[MLHVQCZmlhvqcz]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const ys: number[] = [];
  let i = 0, y = 0, command = '';
  const next = () => Number(tokens[i++]);
  const sample = (at: (t: number) => number) => {
    for (let step = 0; step <= 32; step++) {
      ys.push(at(step / 32));
    }
  };
  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) {
      command = tokens[i++];
    }
    switch (command) {
      case 'M': case 'L': next(); y = next(); ys.push(y); break;
      case 'm': case 'l': next(); y += next(); ys.push(y); break;
      case 'H': case 'h': next(); break;
      case 'V': y = next(); ys.push(y); break;
      case 'v': y += next(); ys.push(y); break;
      case 'Q': {
        next(); const y1 = next(); next(); const y2 = next(); const y0 = y;
        sample((t) => (1 - t) ** 2 * y0 + 2 * (1 - t) * t * y1 + t * t * y2);
        y = y2; break;
      }
      case 'C': {
        next(); const y1 = next(); next(); const y2 = next(); next(); const y3 = next(); const y0 = y;
        sample((t) => (1 - t) ** 3 * y0 + 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t * t * y2 + t ** 3 * y3);
        y = y3; break;
      }
      case 'Z': case 'z': break;
      default: throw new Error(`unsupported path command ${command}`);
    }
  }
  return Math.max(...ys) - Math.min(...ys);
}

function markHeights(): Map<string, number> {
  const icon = extension!.packageJSON.contributes.viewsContainers.activitybar[0].icon as string;
  const svg = fs.readFileSync(path.join(extension!.extensionPath, icon), 'utf8');
  return new Map([...svg.matchAll(/<path id="([\w-]+)" d="([^"]+)"/g)].map((m) => [m[1], pathHeight(m[2])]));
}

describe('Test the activity-bar icon', () => {
  for (const side of ['up', 'down']) {
    it(`Must shrink its marks ${side} from the "12": 12 > 1 > 2 > 3`, () => {
      const heights = markHeights();
      const chain = ['twelve', `${side}1`, `${side}2`, `${side}3`];
      for (const id of chain) {
        assert.ok(heights.has(id), `the icon has no mark with id ${id}`);
      }
      for (let k = 1; k < chain.length; k++) {
        const [outer, inner] = [heights.get(chain[k])!, heights.get(chain[k - 1])!];
        assert.ok(inner > outer + 0.01, `${chain[k - 1]} (${inner.toFixed(2)} px) must be taller than ${chain[k]} (${outer.toFixed(2)} px)`);
      }
    });
  }
});
