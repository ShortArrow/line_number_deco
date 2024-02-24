// This file is generated from package.json.
// Do not modify this file manually.

import * as vscode from "vscode";

export class LineNumberDeco {
  /**
   * LineNumberDeco: Enable rainbow for workspace
   */   
  static enableRainbow(callback: Function) {
    return vscode.commands.registerCommand('line-number-deco.enableRainbow', () =>
      callback()
    );
  }

  /**
   * LineNumberDeco: Disable rainbow for workspace
   */   
  static disableRainbow(callback: Function) {
    return vscode.commands.registerCommand('line-number-deco.disableRainbow', () =>
      callback()
    );
  }

  /**
   * LineNumberDeco: Enable rainbow for user
   */   
  static enableRainbowForUser(callback: Function) {
    return vscode.commands.registerCommand('line-number-deco.enableRainbowForUser', () =>
      callback()
    );
  }

  /**
   * LineNumberDeco: Disable rainbow for user
   */   
  static disableRainbowForUser(callback: Function) {
    return vscode.commands.registerCommand('line-number-deco.disableRainbowForUser', () =>
      callback()
    );
  }

  /**
   * LineNumberDeco: Update color at center of rainbow for workspace
   */   
  static updateColorAtCenterOfRainbow(callback: Function) {
    return vscode.commands.registerCommand('line-number-deco.updateColorAtCenterOfRainbow', () =>
      callback()
    );
  }

  /**
   * LineNumberDeco: Update color at center of rainbow for user
   */   
  static updateColorAtCenterOfRainbowForUser(callback: Function) {
    return vscode.commands.registerCommand('line-number-deco.updateColorAtCenterOfRainbowForUser', () =>
      callback()
    );
  }

  /**
   * LineNumberDeco: Update color at current row number
   */   
  static updateColorAtActiveRowNumber(callback: Function) {
    return vscode.commands.registerCommand('line-number-deco.updateColorAtActiveRowNumber', () =>
      callback()
    );
  }

  /**
   * LineNumberDeco: Update color at current row number for user
   */   
  static updateColorAtActiveRowNumberForUser(callback: Function) {
    return vscode.commands.registerCommand('line-number-deco.updateColorAtActiveRowNumberForUser', () =>
      callback()
    );
  }

  /**
   * LineNumberDeco: Update color at inactive row number
   */   
  static updateColorAtInactiveRowNumber(callback: Function) {
    return vscode.commands.registerCommand('line-number-deco.updateColorAtInactiveRowNumber', () =>
      callback()
    );
  }

  /**
   * LineNumberDeco: Update color at inactive row number for user
   */   
  static updateColorAtInactiveRowNumberForUser(callback: Function) {
    return vscode.commands.registerCommand('line-number-deco.updateColorAtInactiveRowNumberForUser', () =>
      callback()
    );
  }

  /**
   * LineNumberDeco: Update color of repeating digits for workspace
   */   
  static updateColorAtRepeatingDigits(callback: Function) {
    return vscode.commands.registerCommand('line-number-deco.updateColorAtRepeatingDigits', () =>
      callback()
    );
  }

  /**
   * LineNumberDeco: Update color of repeating digits for user
   */   
  static updateColorAtRepeatingDigitsForUser(callback: Function) {
    return vscode.commands.registerCommand('line-number-deco.updateColorAtRepeatingDigitsForUser', () =>
      callback()
    );
  }

  /**
   * LineNumberDeco: Enable Relative Line Numbers in This workspace
   */   
  static enableRelativeLineNumbers(callback: Function) {
    return vscode.commands.registerCommand('line-number-deco.enableRelativeLineNumbers', () =>
      callback()
    );
  }

  /**
   * LineNumberDeco: Enable Relative Line Numbers for user
   */   
  static enableRelativeLineNumbersForUser(callback: Function) {
    return vscode.commands.registerCommand('line-number-deco.enableRelativeLineNumbersForUser', () =>
      callback()
    );
  }

  /**
   * LineNumberDeco: Disable Relative Line Numbers in This workspace
   */   
  static disableRelativeLineNumbers(callback: Function) {
    return vscode.commands.registerCommand('line-number-deco.disableRelativeLineNumbers', () =>
      callback()
    );
  }

  /**
   * LineNumberDeco: Disable Relative Line Numbers for user
   */   
  static disableRelativeLineNumbersForUser(callback: Function) {
    return vscode.commands.registerCommand('line-number-deco.disableRelativeLineNumbersForUser', () =>
      callback()
    );
  }

  /**
   * LineNumberDeco: Enable repeating digits in this workspace
   */   
  static enableRepeatingDigits(callback: Function) {
    return vscode.commands.registerCommand('line-number-deco.enableRepeatingDigits', () =>
      callback()
    );
  }

  /**
   * LineNumberDeco: Disable repeating digits color in this workspace
   */   
  static disableRepeatingDigits(callback: Function) {
    return vscode.commands.registerCommand('line-number-deco.disableRepeatingDigits', () =>
      callback()
    );
  }

  /**
   * LineNumberDeco: Enable repeating digits color for user
   */   
  static enableRepeatingDigitsForUser(callback: Function) {
    return vscode.commands.registerCommand('line-number-deco.enableRepeatingDigitsForUser', () =>
      callback()
    );
  }

  /**
   * LineNumberDeco: Disable repeating digits color for user
   */   
  static disableRepeatingDigitsForUser(callback: Function) {
    return vscode.commands.registerCommand('line-number-deco.disableRepeatingDigitsForUser', () =>
      callback()
    );
  }
}