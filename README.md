# LineNumberDeco

[![version icon](https://shields.io/visual-studio-marketplace/v/ShortArrow.line-number-deco)](https://marketplace.visualstudio.com/items?itemName=ShortArrow.line-number-deco)
[![license icon](https://shields.io/github/license/ShortArrow/line_number_deco)](https://github.com/ShortArrow/line_number_deco/blob/main/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-blueviolet.svg)](https://github.com/ShortArrow/line_number_deco/pulls)

LineNumberDeco is a Visual Studio Code extension.
Adds relative line numbers to Visual Studio Code with decorations.
This is useful if you are using one of the Emacs or Vim like plugins.

The relative line number can be displayed with only the standard function of vscode. However, when doing pair programming using liveshare or  face-to-face, it is easier to communicate if absolute line numbers are displayed. This extension is useful when you want to display both absolute and relative line numbers.

This extension has not anoying for testrunners or debuggers.
Because, it does not block the display of breakpoint icons, test start icons, test result icons, etc.

## Recommended Usage

Use with these recomended plugins.

- [VSCode Neovim](https://marketplace.visualstudio.com/items?itemName=asvetliakov.vscode-neovim)
- [Spacemacs](https://marketplace.visualstudio.com/items?itemName=cometeer.spacemacs)
- [Emacs](https://marketplace.visualstudio.com/items?itemName=vscodeemacs.emacs)
- [VSCode Vim](https://marketplace.visualstudio.com/items?itemName=vscodevim.vim)
- [VSpaceCode](https://marketplace.visualstudio.com/items?itemName=VSpaceCode.vspacecode)
- [Neovim UI Modifier](https://marketplace.visualstudio.com/items?itemName=JulianIaquinandi.nvim-ui-modifier)
- [Emacs Friendly Keymap](https://marketplace.visualstudio.com/items?itemName=lfs.vscode-emacs-friendly)
- [Vimacs](https://marketplace.visualstudio.com/items?itemName=migrs.vimacs)

## Features

Show relative line numbers
![visual representation of the action](./images/Animation.gif)
![stative image](./images/static_image.png)

## Inspired

Thank you for pioneering

- [Double line numbers](https://marketplace.visualstudio.com/items?itemName=slhsxcmy.vscode-double-line-numbers)
- [Relative line numbers](https://marketplace.visualstudio.com/items?itemName=extr0py.vscode-relative-line-numbers)

## VSCode Embedded Configuration

If you want not to use this extension, you can use vscode embedded configuration.
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
