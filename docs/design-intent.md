# Design intent

Each section states what one part of the toolchain, the pipeline or the panel protects, why it is arranged the way it is, and what it refuses while that reason holds. How to run each part is in [development.md](development.md).

## Dependencies are pinned through pnpm overrides

Every dependency is a devDependency, and almost every advisory lands on a transitive package that a direct dependency still asks for at a vulnerable range. Dependabot only rewrites direct dependencies, so it cannot raise such a package and its update job fails. An entry in the `overrides` map of `pnpm-workspace.yaml` closes the advisory in one line without waiting for the direct dependency to move, and it is removed once the direct dependency catches up.

The root, `smoke/` and `ui-test/` are three pnpm roots with three lockfiles, because the extension must not carry a test driver into its VSIX. An advisory in a package that two roots share is overridden in both. `vsce package` runs with `--no-dependencies`, because vsce cannot read pnpm's non-hoisted `node_modules`, and the VSIX needs no runtime dependency.

## Every change reaches main through its own short branch

A branch carries one topic, is cut from `main` and returns to it through a pull request, so every change is reviewed at the size it was written and `main` is always the candidate for the next release. There is no `develop` and no release branch. A change that is not ready stays off `main`, because nothing else would hold it back from the next tag.

## A pushed tag drives the release, and a published number is never reused

The release is built from a signed `v*` tag on `main` and passes the same gates in order every time, so a release can be reproduced from its tag alone. A version number the Marketplace has published can never be published again: the store keeps serving the old build under that number without an error. The pipeline therefore refuses a tag whose number either registry already carries, before any test runs. A registry it cannot reach only warns, so that a store outage cannot block a GitHub release.

A tag with a suffix is a rehearsal: it reuses the base version on purpose, its GitHub Release is marked pre-release, and nothing is published to a registry. The Marketplace's own pre-release channel is not used. A user opts into that channel once and receives every higher version from then on, so it has to be fed continuously, which an extension with occasional releases cannot do. Each channel release would also consume a version number, because the Marketplace accepts only `major.minor.patch`.

## Registries are published to with personal access tokens

`vsce publish` authenticates with `VSCE_PAT` and `ovsx publish` with `OVSX_PAT`. The secretless route, an Entra identity reached through GitHub OIDC, is already written into `release.yml` ahead of the PAT step, and it stays dormant while `AZURE_CLIENT_ID` and `AZURE_TENANT_ID` are unset. The `ShortArrow` publisher is owned by a Microsoft personal account, and the Marketplace cannot resolve an Entra service principal as a member of such a publisher; it answers TF14045. The day the publisher moves under an Entra tenant, setting the two variables switches the route without a code change.

`publish.yml` reads the same secrets, so a release whose credential was missing when it was tagged can be published later from the VSIX it already built, without a rebuild.

## Pull requests click the settings panel in a real VS Code

The unit tests mock the webview and assert on the functions behind it, so a click that a state message overwrites a moment later passes them, and the smoke test only proves that the extension activates. Click semantics, message ordering, iframe timing and what the editor actually paints exist only in a running VS Code. `ui-test/` drives a real VS Code desktop with vscode-extension-tester on every pull request to `main`, on Linux, Windows and macOS, because a release ships to all three.

VS Code is pinned to the newest version the installed vscode-extension-tester supports, because a newer one downloads without complaint and then fails on locators the tester does not know. Linux needs `xvfb-run` for a display; the Windows and macOS runners have a desktop of their own. A failing run is retried once, because a webview can be a frame late; two consecutive failures count as a real one.

## The webview's script and stylesheet are bundled at build time

The panel's browser code lives in `src/webview/` under its own DOM-typed tsconfig, so tsc and eslint check it, and it imports the color and state functions it needs by name. esbuild bundles it into `src/generated/webviewAssets.ts` during `compile`, so a missing import fails the build rather than the panel, and the panel reads nothing from disk when it resolves. The bundle keeps its identifiers: the panel tests read the rendered html, and a function renamed to one letter would leave them asserting nothing.

## The settings panel never offers a write that cannot succeed

With no folder open there are no Workspace settings to write, so the Workspace radio is disabled with a title that says why, and the panel opens on User. A disabled radio says this before the click. An error after Apply would say it only once the reader had made a choice that could not work, and switching the scope by itself would move the reader's choice without asking.

Hiding the view keeps every staged value, because hiding is how a reader looks at the editor behind the panel and has not decided to discard anything. Reset and Reset all are the way to discard. The full state model is in [panel-staging.md](panel-staging.md).
