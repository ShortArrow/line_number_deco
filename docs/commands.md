# Commands

Every command of the extension, with the id to use from a keybinding or `init.lua`. Workspace variants write to the current workspace; `ForUser` variants write to your user settings.

| Command | Title |
| --- | --- |
| `line-number-deco.enableRainbow` | LineNumberDeco: Enable rainbow for workspace |
| `line-number-deco.disableRainbow` | LineNumberDeco: Disable rainbow for workspace |
| `line-number-deco.enableRainbowForUser` | LineNumberDeco: Enable rainbow for user |
| `line-number-deco.disableRainbowForUser` | LineNumberDeco: Disable rainbow for user |
| `line-number-deco.updateColorAtCenterOfRainbow` | LineNumberDeco: Update color at center of rainbow for workspace |
| `line-number-deco.updateColorAtCenterOfRainbowForUser` | LineNumberDeco: Update color at center of rainbow for user |
| `line-number-deco.updateColorAtActiveRowNumber` | LineNumberDeco: Update color at current row number |
| `line-number-deco.updateColorAtActiveRowNumberForUser` | LineNumberDeco: Update color at current row number for user |
| `line-number-deco.updateColorAtInactiveRowNumber` | LineNumberDeco: Update color at inactive row number |
| `line-number-deco.updateColorAtInactiveRowNumberForUser` | LineNumberDeco: Update color at inactive row number for user |
| `line-number-deco.updateColorAtRepeatingDigits` | LineNumberDeco: Update color of repeating digits for workspace |
| `line-number-deco.updateColorAtRepeatingDigitsForUser` | LineNumberDeco: Update color of repeating digits for user |
| `line-number-deco.updateColorAtSequentialDigits` | LineNumberDeco: Update color of sequential digits for workspace |
| `line-number-deco.updateColorAtSequentialDigitsForUser` | LineNumberDeco: Update color of sequential digits for user |
| `line-number-deco.enableRelativeLineNumbers` | LineNumberDeco: Enable Relative Line Numbers in This workspace |
| `line-number-deco.enableRelativeLineNumbersForUser` | LineNumberDeco: Enable Relative Line Numbers for user |
| `line-number-deco.disableRelativeLineNumbers` | LineNumberDeco: Disable Relative Line Numbers in This workspace |
| `line-number-deco.disableRelativeLineNumbersForUser` | LineNumberDeco: Disable Relative Line Numbers for user |
| `line-number-deco.enableRepeatingDigits` | LineNumberDeco: Enable repeating digits in this workspace |
| `line-number-deco.disableRepeatingDigits` | LineNumberDeco: Disable repeating digits color in this workspace |
| `line-number-deco.enableRepeatingDigitsForUser` | LineNumberDeco: Enable repeating digits color for user |
| `line-number-deco.disableRepeatingDigitsForUser` | LineNumberDeco: Disable repeating digits color for user |
| `line-number-deco.enableSequentialDigits` | LineNumberDeco: Enable sequential digits in this workspace |
| `line-number-deco.disableSequentialDigits` | LineNumberDeco: Disable sequential digits color in this workspace |
| `line-number-deco.enableSequentialDigitsForUser` | LineNumberDeco: Enable sequential digits color for user |
| `line-number-deco.disableSequentialDigitsForUser` | LineNumberDeco: Disable sequential digits color for user |
| `line-number-deco.showSettingsPanel` | LineNumberDeco: Show settings panel |
| `line-number-deco.hideSettingsPanel` | LineNumberDeco: Hide settings panel |
| `line-number-deco.toggleSettingsPanel` | LineNumberDeco: Toggle settings panel |

Calling one from [VSCode Neovim](https://marketplace.visualstudio.com/items?itemName=asvetliakov.vscode-neovim):

```lua
vim.fn.VSCodeNotify('line-number-deco.toggleSettingsPanel')
```
