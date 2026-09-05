# LineNumberDeco

[![version icon](https://shields.io/visual-studio-marketplace/v/ShortArrow.line-number-deco)](https://marketplace.visualstudio.com/items?itemName=ShortArrow.line-number-deco)
[![license icon](https://shields.io/github/license/ShortArrow/line_number_deco)](https://github.com/ShortArrow/line_number_deco/blob/main/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-blueviolet.svg)](https://github.com/ShortArrow/line_number_deco/pulls)

[![Open VSX Version](https://img.shields.io/open-vsx/v/ShortArrow/line-number-deco)](https://open-vsx.org/extension/shortarrow/line-number-deco/)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/shortarrow/line-number-deco)](https://open-vsx.org/extension/shortarrow/line-number-deco/)

LineNumberDeco is a Visual Studio Code extension.
Adds relative line numbers to Visual Studio Code with decorations.
This is useful if you are using one of the Emacs or Vim like plugins.

The relative line number can be displayed with only the standard function of vscode. However, when doing pair programming using liveshare or  face-to-face, it is easier to communicate if absolute line numbers are displayed. This extension is useful when you want to display both absolute and relative line numbers.

This extension has not anoying for testrunners or debuggers.
Because, it does not block the display of breakpoint icons, test start icons, test result icons, etc.

## Recommended Usage

Use with these recomended plugins.

- [VSCode Neovim](https://marketplace.visualstudio.com/items?itemName=asvetliakov.vscode-neovim)
- [VSCode Vim](https://marketplace.visualstudio.com/items?itemName=vscodevim.vim)
- [Helix For VS Code](https://marketplace.visualstudio.com/items?itemName=jasew.vscode-helix-emulation)
- [Awesome Emacs Keymap](https://marketplace.visualstudio.com/items?itemName=tuttieee.emacs-mcx)
- [VSpaceCode](https://marketplace.visualstudio.com/items?itemName=VSpaceCode.vspacecode)
- [Neovim UI Modifier](https://marketplace.visualstudio.com/items?itemName=JulianIaquinandi.nvim-ui-modifier)

## Features

Show relative line numbers
![visual representation of the action](./images/Animation.gif)
![stative image](./images/static_image.png)

## Settings

Relative line numbers are on by default and use your theme's colors. Two decorations can be layered on top: `enableRainbow` colors each number by its distance from the cursor, and `enableRepeatingDigits` gives numbers whose digits all repeat (11, 22, 333) their own color. `enableSequentialDigits` does the same for runs of consecutive digits (123, 543, 10).

Every key, with types and defaults: [docs/settings.md](docs/settings.md).

The color settings show a color picker when edited in `settings.json`.

## Settings panel

The LineNumberDeco icon in the activity bar opens a panel for every setting of this extension, and for `editor.lineNumbers` itself. Changes preview in the editor at once; nothing is saved until Apply. The radio at the top picks the scope you are editing, and the scope the rows show. Closing the panel discards anything unapplied.

## Commands

Everything the panel does is also a palette command, named on one pattern: `LineNumberDeco: Enable/Disable <decoration> ...` and `LineNumberDeco: Update color ...`, each in a workspace and a `for user` variant. For example:

- `LineNumberDeco: Enable rainbow for workspace`
- `LineNumberDeco: Toggle settings panel`

The ids matter only for keybindings and `init.lua`; every id and title is in [docs/commands.md](docs/commands.md).

## Calling commands from init.lua

With [VSCode Neovim](https://marketplace.visualstudio.com/items?itemName=asvetliakov.vscode-neovim), any command from [docs/commands.md](docs/commands.md) can be called from Lua:

```lua
vim.fn.VSCodeNotify('line-number-deco.enableRainbow')
```

For example, bound to a key:

```lua
vim.keymap.set('n', '<leader>lr', function()
  vim.fn.VSCodeNotify('line-number-deco.enableRainbow')
end)
```

## Inspired

Thank you for pioneering

- [Double line numbers](https://marketplace.visualstudio.com/items?itemName=slhsxcmy.vscode-double-line-numbers)
- [Relative line numbers](https://marketplace.visualstudio.com/items?itemName=extr0py.vscode-relative-line-numbers)

## VSCode Embedded Configuration

If you want not to use this extension, you can use vscode embedded configuration. The settings panel writes this same setting, if you would rather pick it there.
`editor.lineNumbers` to `relative` then you can use relative line numbers.

```json
{
    // ... other settings
    "editor.lineNumbers": "on" // or "relative" or "off" or "interval", "on" is default
    // ... other settings
}
```

Or you can use `editor.lineNumbers` to `off`.
Then only show line numbers in your vscode by this extension.

## License

MIT License

## Road Map

- More faster!!!
- More variations to the decoration
