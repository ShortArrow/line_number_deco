# Commands

Every command of the extension, with the id to use from a keybinding or `init.lua`. Workspace variants write to the current workspace; `ForUser` variants write to your user settings.

| Command | Title |
| --- | --- |
| `line-number-deco.enableRainbow` | LineNumberDeco: Enable rainbow for workspace |
| `line-number-deco.disableRainbow` | LineNumberDeco: Disable rainbow for workspace |
| `line-number-deco.enableRainbowForUser` | LineNumberDeco: Enable rainbow for user |
| `line-number-deco.disableRainbowForUser` | LineNumberDeco: Disable rainbow for user |
| `line-number-deco.updateColorAtCenterOfRainbow` | LineNumberDeco: Update color of the rainbow center for workspace |
| `line-number-deco.updateColorAtCenterOfRainbowForUser` | LineNumberDeco: Update color of the rainbow center for user |
| `line-number-deco.updateColorAtActiveRowNumber` | LineNumberDeco: Update color of the current line number for workspace |
| `line-number-deco.updateColorAtActiveRowNumberForUser` | LineNumberDeco: Update color of the current line number for user |
| `line-number-deco.updateColorAtInactiveRowNumber` | LineNumberDeco: Update color of inactive line numbers for workspace |
| `line-number-deco.updateColorAtInactiveRowNumberForUser` | LineNumberDeco: Update color of inactive line numbers for user |
| `line-number-deco.updateColorAtRepeatingDigits` | LineNumberDeco: Update color of repeating digits for workspace |
| `line-number-deco.updateColorAtRepeatingDigitsForUser` | LineNumberDeco: Update color of repeating digits for user |
| `line-number-deco.updateColorAtSequentialDigits` | LineNumberDeco: Update color of sequential digits for workspace |
| `line-number-deco.updateColorAtSequentialDigitsForUser` | LineNumberDeco: Update color of sequential digits for user |
| `line-number-deco.enableRelativeLineNumbers` | LineNumberDeco: Enable relative line numbers for workspace |
| `line-number-deco.enableRelativeLineNumbersForUser` | LineNumberDeco: Enable relative line numbers for user |
| `line-number-deco.disableRelativeLineNumbers` | LineNumberDeco: Disable relative line numbers for workspace |
| `line-number-deco.disableRelativeLineNumbersForUser` | LineNumberDeco: Disable relative line numbers for user |
| `line-number-deco.enableRepeatingDigits` | LineNumberDeco: Enable repeating digits color for workspace |
| `line-number-deco.disableRepeatingDigits` | LineNumberDeco: Disable repeating digits color for workspace |
| `line-number-deco.enableRepeatingDigitsForUser` | LineNumberDeco: Enable repeating digits color for user |
| `line-number-deco.disableRepeatingDigitsForUser` | LineNumberDeco: Disable repeating digits color for user |
| `line-number-deco.enableSequentialDigits` | LineNumberDeco: Enable sequential digits color for workspace |
| `line-number-deco.disableSequentialDigits` | LineNumberDeco: Disable sequential digits color for workspace |
| `line-number-deco.enableSequentialDigitsForUser` | LineNumberDeco: Enable sequential digits color for user |
| `line-number-deco.disableSequentialDigitsForUser` | LineNumberDeco: Disable sequential digits color for user |
| `line-number-deco.showSettingsPanel` | LineNumberDeco: Show settings panel |
| `line-number-deco.hideSettingsPanel` | LineNumberDeco: Hide settings panel |
| `line-number-deco.toggleSettingsPanel` | LineNumberDeco: Toggle settings panel |

Calling one from [VSCode Neovim](https://marketplace.visualstudio.com/items?itemName=asvetliakov.vscode-neovim):

```lua
vim.fn.VSCodeNotify('line-number-deco.toggleSettingsPanel')
```
