/**
 * Minify the extension's compiled modules in place, after tsc has written them.
 *
 * Each module stays its own file, so a test that imports `out/panel.js` shares
 * module state with the running extension, and the generated command table
 * stays where the packaged-VSIX check looks for it. The test files under
 * `out/test/` are left readable.
 *
 * esbuild reads the source map tsc wrote beside each file and writes one that
 * still points at `src/`, which coverage and stack traces depend on.
 */

import { build } from "esbuild";
import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "out");

async function modulesIn(folder) {
  const names = await readdir(folder);
  return names.filter((name) => name.endsWith(".js")).map((name) => join(folder, name));
}

await build({
  entryPoints: [...(await modulesIn(out)), ...(await modulesIn(join(out, "generated")))],
  outdir: out,
  outbase: out,
  allowOverwrite: true,
  bundle: false,
  platform: "node",
  format: "cjs",
  target: "es2020",
  minify: true,
  sourcemap: "linked",
  logLevel: "warning",
});
