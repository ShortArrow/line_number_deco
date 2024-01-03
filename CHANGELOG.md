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
