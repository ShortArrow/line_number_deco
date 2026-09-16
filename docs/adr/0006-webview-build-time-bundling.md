# 6. The webview script and stylesheet are bundled at build time

Status: accepted

Date: 2026-09-10

## Context

The settings webview ran a script that lived as a template literal in
`src/panelHtml.ts`, beside a second literal holding its stylesheet. Neither
was reachable by tsc or eslint, so about 420 lines of browser code had no
typechecking at all.

The script needed the color conversions and the pending merge, and got them
at runtime: `readInlineLib` in `src/panel.ts` read the compiled
`out/colorConvert.js` and `out/panelState.js` with `fs.readFileSync` on every
`resolveWebviewView`, and pasted the text into the document behind a
`const exports = {}` shim. Because there was no way to prove from inside the
extension that the paste had really happened, the script assembled the names
it called — `exports[from + 'To' + ...]` — and the tests looked for the
assembled names in the rendered html. Every call site then carried a branch
for the case where the read had failed and the function was undefined.

## Decision

The script moves to `src/webview/panel.ts` and the stylesheet to
`src/webview/panel.css`. The script imports `../colorConvert` and
`../panelState` by name. `scripts/bundle-webview.mjs` runs esbuild over it as
an es2020 iife and writes `src/generated/webviewAssets.ts`, which
`panelHtml.ts` imports; the file is gitignored and produced by `compile`
before either tsc pass. `src/webview` has its own tsconfig with DOM types and
is excluded from the root project, so the node-typed build never sees browser
code.

The bundle is minified for whitespace and syntax but not for identifiers.
The panel tests read the rendered html, and `hexToHsl` renamed to `a` would
leave those assertions checking nothing.

## Consequences

The panel does no filesystem work when it resolves. A name the script imports
that does not exist now fails the build, which is a stronger guarantee than
the string assertions gave, so the two tests that searched the html for
evidence of the paste are gone along with the degradation branches they
justified. esbuild is a build-only dependency and ships in no vsix, which also
settles most of issue #19.
