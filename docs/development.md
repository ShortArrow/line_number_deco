# Working on LineNumberDeco

Everything below runs from a clone of the repository. The extension source is `src/`, and two self-contained harnesses live beside it in `smoke/` and `ui-test/`, each with its own `package.json` and lockfile.

## Install the toolchain

| Tool | Version | Where it is used |
| --- | --- | --- |
| pnpm | 11.22.0 | `packageManager` in every `package.json` |
| Node.js | 22 | the extension: build, unit tests, packaging, release |
| Node.js | 25.x | the `ui-test/` harness only |

Node 26 breaks the `ui-test/` harness: ExTester unpacks the VS Code download through extract-zip 2.0.1, whose unpack promise never settles there, so the run stalls with a truncated VS Code tree.

Install the root dependencies with `pnpm install`. Each harness is installed separately from its own directory.

## Build and run the unit tests

```bash
pnpm test
```

The `test` script runs `pretest` first, which is `pnpm run clean && pnpm run compile && pnpm run lint` — `rimraf ./out`, then `tsc -p ./`, then `eslint src --ext ts`. It then launches `node ./out/test/runTest.js`, which downloads a VS Code build and runs the Mocha suite inside it. Compiled JavaScript lands in `out/`, so `out/test/` holds the suite and `out/generated/generated.js` the table the extension imports at runtime.

On Linux the suite needs a display; CI runs it as `xvfb-run -a pnpm test`.

To compile without testing, run `pnpm compile`; `pnpm watch` keeps `tsc` running. `pnpm package` is an alias for the compile step that `vsce` calls through `vscode:prepublish`.

## Regenerate the reference documents

```bash
pnpm generate
```

This runs `src/generater/fromPackageJson.ts` and rewrites `docs/commands.md` and `docs/settings.md` from the `contributes` block of `package.json`. `src/test/docs.test.ts` binds the two documents to the manifest in both directions: a contributed command or configuration key missing from its table fails, and so does a table row naming an id the manifest no longer has. Run `pnpm generate` after touching `contributes` or the suite goes red.

## Click the settings panel

The `ui-test/` harness drives a real VS Code desktop with vscode-extension-tester and clicks the settings webview. Unit tests mock the webview away, so click semantics only exist here.

1. Package the extension from the repository root with `pnpm exec vsce package --no-dependencies`. A `.vsix` appears in the root.
2. Install and compile the harness: `cd ui-test`, `pnpm install`, `pnpm run compile`. TypeScript from `ui-test/src/` lands in `ui-test/out/`.
3. Download the driven editor: `pnpm exec extest get-vscode --storage .resources --code_version 1.135.0` and `pnpm exec extest get-chromedriver --storage .resources --code_version 1.135.0`. Both land in `ui-test/.resources/`. ExTester 8.25 supports VS Code up to 1.135.0, and a newer stable fails on locators it does not know.
4. Install the packaged extension into the throwaway instance: `pnpm run install-vsix ../line-number-deco-<version>.vsix`. It goes to `ui-test/.test-extensions/`, never to your own VS Code.
5. Run the clicks with `pnpm run run-tests`, under `xvfb-run -a` on Linux.

`.github/workflows/ui-test.yml` does the same on every pull request against `main`. It retries the click step once, because a webview iframe can arrive a frame late, and it uploads `ui-test/.resources/screenshots` on failure.

## Smoke-test a packaged VSIX

The `smoke/` harness asks two questions of a built `.vsix`, and the release pipeline runs both.

`node smoke/inspect-vsix.js <unzipped-dir> <expected-version>` reads an unzipped VSIX without starting VS Code. It checks that `extension.vsixmanifest` and `[Content_Types].xml` survived, that `extension/package.json` carries the expected version with name `line-number-deco` and publisher `ShortArrow`, that the file named by `main` exists and is not empty, that `out/generated/generated.js` shipped, and that nothing under `src/`, `out/test/`, `out/generater/`, `smoke/`, `.github/` or `node_modules/` leaked in alongside `pnpm-lock.yaml`, `pnpm-workspace.yaml` and `yarn.lock`.

`node smoke/run.js --expect-version <X.Y.Z> [--vsix <path>]` downloads VS Code, creates an empty profile under the system temp directory, installs the VSIX into it when `--vsix` is given, and loads a tiny host extension that asserts the real thing. That host checks the extension was loaded from the smoke extensions directory rather than anywhere else, that its version matches, that `activate()` resolves and leaves it active, and that its four rainbow commands are registered. It exits 0 on success, 1 on a failed assertion and 2 when the harness produced no result at all.

CI runs `run.js` twice: once without `--vsix` as a negative control that must exit 1, then once with the artifact. Without the negative control a green smoke run would prove nothing, because the assertions could be passing against a locally present copy of the extension.

## Cut a release

Releases are driven by a signed `v*` tag pushed to `main`; `.github/workflows/release.yml` does the rest in five jobs.

1. `test` runs on ubuntu, windows and macos. It first fails the release if the tag's `X.Y.Z` disagrees with `version` in `package.json`, then refuses a version number either registry already carries, then runs `pnpm test`.
2. `build` packages the artifact with `pnpm exec vsce package --no-dependencies` and uploads the `.vsix`.
3. `smoke` checks out only `smoke/` — sparse, so no other copy of the extension exists on the runner — and runs the structural check, the negative control and the activation smoke against the uploaded artifact.
4. `release` attests build provenance for the `.vsix` through Sigstore, then creates the GitHub Release with generated notes and the artifact attached.
5. `publish-marketplace` publishes to the VS Code Marketplace and to Open VSX.

The burned-version guard in step 1 queries `vsce show ShortArrow.line-number-deco` and `https://open-vsx.org/api/shortarrow/line-number-deco/<version>`. A published version number can never be reused, so a hit is a hard failure; an unreachable registry only warns, so that a store outage cannot block a GitHub release.

A tag with a suffix, such as `v0.0.10-beta.1`, is a pre-release: the same checks run, the GitHub Release is marked pre-release, the burned-version guard is skipped because the base version is reused on purpose, and nothing is published to a registry. `[skip publish]` in the tagged commit's message also opts a release out of the registry step.

Publishing authenticates with the `VSCE_PAT` and `OVSX_PAT` repository secrets. With neither configured, and no Entra variables set, the job skips itself and the GitHub Release still happens.

To publish a release that already exists — a registry added after the tag was cut, or a credential configured later — run `.github/workflows/publish.yml` by `workflow_dispatch` with the tag and a registry choice. It downloads the released `.vsix` and publishes it; nothing is rebuilt.
