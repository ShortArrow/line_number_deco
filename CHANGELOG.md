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
- Add mention Emacs at README.md
  - this means that this extension is useful for Emacs users
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
- Decorated only visible parts to improve speed
- Delete Commands list and Configuration list from `README.md`

## 0.0.8

- Fix bug that decoration is not updated when the cursor is moved to the end of the line
- Fix bug that decoration is not updated when the document size is small than the editor size
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
