# Change Log

All notable changes to the "ShortArrow.line-number-deco" extension will be documented in this file.

## 0.0.1

- Initial release

## 0.0.2

- Add color option

## 0.0.3

- Add rainbow color

## 0.0.4

- Add rainbow commands

## 0.0.5

- Add color update commands

## 0.0.6

- Fix typo Extension Commands name
  - `line-number-doco.enableRelativeLineNumbersGlobal` -> `line-number-deco.enableRelativeLineNumbersGlobal`
  - `line-number-doco.disableRelativeLineNumbersGlobal` -> `line-number-deco.disableRelativeLineNumbersGlobal`
  - `line-number-doco.enableRelativeLineNumbers` -> `line-number-deco.enableRelativeLineNumbers`
  - `line-number-doco.disableRelativeLineNumbers` -> `line-number-deco.disableRelativeLineNumbers`
- Fix typo Extension Config name
  - `enableRlativeLineOnDefault` -> `enableRelativeLine`
- Mention Emacs in `README.md`
  - this extension is useful for Emacs users too
- Add decoration for consecutive line numbers
- Add new options
  - `line-number-deco.enableRepeatingDigits`
  - `line-number-deco.disableRepeatingDigits`
  - `line-number-deco.enableRepeatingDigitsForUser`
  - `line-number-deco.disableRepeatingDigitsForUser`
  - `line-number-deco.updateColorAtRepeatingDigits`
  - `line-number-deco.updateColorAtRepeatingDigitsForUser`

## 0.0.7

- Add 'nvim' and 'helix' to `README.md`
- Decorate only the visible lines, to improve speed
- Delete Commands list and Configuration list from `README.md`

## 0.0.8

- Fix bug that decoration is not updated when the cursor is moved to the end of the line
- Fix bug that decoration is not updated when the document size is smaller than the editor size

## 0.0.9

- Declare `extensionKind` (`ui`, `workspace`) so the extension loads on either side of a remote session
- Published to the Marketplace on 2024-02-25; there was no GitHub release, which is why this entry was reconstructed later

## 0.0.10

- The scope radio also selects which scope the panel shows, so a user-level value is visible even when the workspace overrides it
- Color settings show a color picker in `settings.json` (#34)
- Fix relative numbers disappearing below a folded region (#32)
- Fix numbers not updating when mouse-scrolling an editor that does not have the cursor (#30)
- Decorate visible editors on startup and when editors become visible, instead of waiting for the first cursor move or scroll
- Sequential-digit line numbers (123, 543, 10) can get their own color — poker mode (#12)
- Releases are built by GitHub Actions on tag push: tests on three OSes, a packaged VSIX with build provenance, and an installation smoke test (#29)
- The VSIX no longer ships tests, the generator, or CI files
- CI clicks the settings panel for real before a release can regress it (ExTester on xvfb)
- Package manager is pnpm instead of Yarn
- A settings panel in the activity bar previews toggles and colors live, with per-row Apply and Apply all per workspace or user (#21)
- List settings and commands in `README.md` (#20), add an `init.lua` example (#31), and trim the recommended plugin list to maintained extensions (#26)
- Commands to show, hide and toggle the settings panel, callable from the palette or init.lua
- The panel also controls VS Code's editor.lineNumbers, staged like everything else (no live preview: VS Code draws its own numbers)
- Color rows expand into HSL or RGB slider editors, because the native picker's 2-D plane looks the same in every format
- Color rows gain a 2-D picking surface, an editable hex field and Reset controls beside Apply

## 0.0.11

- Same content as the 0.0.10 GitHub release. The version number moves because a different build was published to the Marketplace as 0.0.10 back in January 2025, and the store rejects a number it has seen; the release pipeline now refuses to ship a version the Marketplace already has
- The VSIX no longer carries the README images or the icon source; the packaged README already loads them from the repository (about 680 KB down to about 90 KB)

## 0.2.0

- Version numbers follow the Marketplace pre-release convention from here: an odd minor (0.1.x) is a pre-release, an even minor (0.2.x) a release; 0.0.12 and 0.1.0 were never published, and this content ships straight to the release channel as 0.2.0
- Line numbers on lines an error or a warning starts on take the diagnostic's color, ahead of every other rule including the current line ([#74](https://github.com/ShortArrow/line_number_deco/issues/74))
- Dependency advisories cleared: serialize-javascript, fast-uri, qs, diff and js-yaml move past their patched versions (mocha goes 10 to 11 along the way); the one advisory without a fix, extract-zip inside the UI-test harness, is dismissed with its reasoning recorded on the alert
- The settings panel remembers the selected scope across a switch to another sidebar view, and asks the extension for the current state as soon as it is shown again
- A Sponsor link to [github.com/sponsors/ShortArrow](https://github.com/sponsors/ShortArrow) appears on the Marketplace page and in the extension details header
- Command titles and setting descriptions are rewritten in consistent English (every id is unchanged); the README is reordered around the product, the contributor guide and decision records are brought up to date, and the missing 0.0.9 entry is restored to this file
