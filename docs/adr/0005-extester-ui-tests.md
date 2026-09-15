# 5. Pull requests click the settings panel in a real VS Code

Status: accepted

Date: 2026-09-05

## Context

The settings panel gained a segmented control for `editor.lineNumbers` in PR #59, and it shipped with a bug: clicking a segment made it bounce back. A state message from the extension arrived after the click and overwrote the option the user had just picked. PR #60 fixed it by carrying pending previews in the state message, so the displayed value is decided from saved plus pending in one place.

The suite did not catch it and could not have. The unit tests — 248 passing as the Mocha runner counted them at the time — mock the webview away and assert on the pure functions behind it, so a click that is immediately overwritten by a message looks like a correct message handler and a correct renderer. The smoke test in `smoke/` only proves the extension activates. Click semantics, message ordering and iframe timing exist only in a running VS Code.

## Decision

Add a `ui-test/` harness that drives a real VS Code desktop with vscode-extension-tester 8.25, and run it on every pull request against `main` through `.github/workflows/ui-test.yml`. The harness was added in PR #61, merged 2026-09-05.

The test opens the LineNumberDeco view in the activity bar, clicks a segment of the `editor.lineNumbers` control, waits two seconds for a state message to overwrite it, and asserts the choice survived and that the user settings file the instance writes to reflects it. The VSIX under test is built by the workflow and installed into a throwaway instance under `ui-test/.test-extensions/`, never into the runner's own VS Code.

## Consequences

An interaction bug of the class that produced the bounce now fails a pull request instead of a release. The scope is one panel and one control, so it is a regression guard rather than coverage of the webview.

The job costs a full VS Code and ChromeDriver download per run, pinned to 1.135.0 because ExTester 8.25 knows locators only up to that version, and it needs `xvfb` for a display. Webview automation flakes — an iframe can be a frame late, a click can land mid-layout — so the click step retries once and two consecutive failures are treated as real. Screenshots from `ui-test/.resources/screenshots` are uploaded whenever the job ends, which is the only way to see what the driver saw.
