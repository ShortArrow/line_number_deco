# Line number deco

![version icon](https://shields.io/visual-studio-marketplace/v/ShortArrow.line-number-deco)
![license icon](https://shields.io/github/license/ShortArrow/line_number_deco.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-blueviolet.svg)

Line number deco is a simple Visual Studio Code extension that adds relative line numbers to Visual Studio Code.
This is useful if you are using one of the VIM plugins.

## Recommended Usage

Use with these recomended plugins.

- [VSCode Neovim](https://marketplace.visualstudio.com/items?itemName=asvetliakov.vscode-neovim)
- [VSCode Vim](https://marketplace.visualstudio.com/items?itemName=vscodevim.vim)
- [VSpaceCode](https://marketplace.visualstudio.com/items?itemName=VSpaceCode.vspacecode)
- [Neovim UI Modifier](https://marketplace.visualstudio.com/items?itemName=JulianIaquinandi.nvim-ui-modifier)

## Features

Show relative line numbers
![visual representation of the action](./images/Animation.gif)

This extension has not anoying for testrunners or debuggers.

## Requirements

none.

## Extension Settings

- `LineNumberDeco.enableRlativeLineOnDefault`: Enable display relative line on vscode startup
- `LineNumberDeco.activeForeground`: Override color of active relative line number
- `LineNumberDeco.foreground`: Override color of inactive relative line number

## Extension Commands

- `line-number-doco.enableRelativeLineNumbers`: Enable Relative Line Numbers in This workspace
- `line-number-doco.enableRelativeLineNumbersGlobal`: Enable Relative Line Numbers for User
- `line-number-doco.disableRelativeLineNumbers`: Disable Relative Line Numbers in This workspace
- `line-number-doco.disableRelativeLineNumbersGlobal`: Disable Relative Line Numbers for User

## Known Issues

none.

## Inspired

Thank you for pioneering

- [Double line numbers](https://marketplace.visualstudio.com/items?itemName=slhsxcmy.vscode-double-line-numbers)
- [Relative line numbers](https://marketplace.visualstudio.com/items?itemName=extr0py.vscode-relative-line-numbers)

## License

MIT License

## Release Notes

### 0.0.1
