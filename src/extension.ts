import * as vscode from "vscode";

const vsCodeGlobal = vscode.ConfigurationTarget
  .Global as vscode.ConfigurationTarget;

const defaultCenterColorOfRainbow = "#8888ff";

const nameOfExtension = "LineNumberDeco";

const decorationType = vscode.window.createTextEditorDecorationType({});

/**
 * get is dark theme
 * @returns if dark theme, return true
 */
function getIsDark() {
  return vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark;
}

/**
 * shift hue of color code
 * @param colorCode color code (e.g. #ffffff)
 * @param shift shift value (0～11)
 * @returns shifted color code (e.g. #ffffff)
 */
function shiftHue(colorCode: string, shift: number) {
  const [r, g, b] = rgbFromColorCode(colorCode);
  const [h, s, l] = hslFromRgb(r, g, b);
  const huePerStep = 360 / 16;
  const hue = (((h + shift * huePerStep) % 360) + 360) % 360;
  return colorCodeFromHsl(hue, s, l);
}

/**
 * get rgb value from color code
 * @param colorCode color code (e.g. #ffffff)
 * @returns RGB value array [r, g, b]
 */
function rgbFromColorCode(colorCode: string): number[] {
  const hex = colorCode.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return [r, g, b];
}

/**
 * RGB value to HSL value conversion helper function
 * @param r red component (0～255)
 * @param g green component (0～255)
 * @param b blue component (0～255)
 * @returns HSL value array [h, s, l]
 */
function hslFromRgb(r: number, g: number, b: number): number[] {
  const min = Math.min(r, g, b) / 255;
  const max = Math.max(r, g, b) / 255;
  const delta = max - min;

  let h, s, l;

  if (delta === 0) {
    h = 0;
  } else if (max === r / 255) {
    h = 60 * ((g / 255 - b / 255) / delta);
  } else if (max === g / 255) {
    h = 60 * ((b / 255 - r / 255) / delta + 2);
  } else {
    h = 60 * ((r / 255 - g / 255) / delta + 4);
  }

  if (h < 0) {
    h += 360;
  }

  l = (max + min) / 2;

  if (delta === 0) {
    s = 0;
  } else {
    s = delta / (1 - Math.abs(2 * l - 1));
  }

  return [h, s, l];
}

/**
 * Hsl to #?????? formatted string translation helper function
 * @param h hue
 * @param s saturation
 * @param l luminescence
 * @returns #?????? formatted string
 */
function colorCodeFromHsl(h: number, s: number, l: number): string {
  const [r, g, b] = rgbFromHsl(h, s, l);
  return rgbToColorCode(r, g, b);
}

/**
 * Hsl to rgb translation helper function
 * @param h hue
 * @param s saturation
 * @param l luminescence
 * @returns HSL value array [h, s, l]
 */
function rgbFromHsl(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1
      ? [c, x, 0]
      : hp < 2
      ? [x, c, 0]
      : hp < 3
      ? [0, c, x]
      : hp < 4
      ? [0, x, c]
      : hp < 5
      ? [x, 0, c]
      : [c, 0, x];
  const m = l - 0.5 * c;
  const [r, g, b] = [r1 + m, g1 + m, b1 + m];
  return [Math.round(255 * r), Math.round(255 * g), Math.round(255 * b)];
}

/**
 * rgb to #?????? formatted string translation helper function
 * @param r red component (0～255)
 * @param g green component (0～255)
 * @param b blue component (0～255)
 * @returns #?????? formatted string
 */
function rgbToColorCode(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/**
 * update relative line numbers
 * @param editor
 * @param decorationType
 * @returns void
 */
async function updateRelativeLineNumbers(
  editor: vscode.TextEditor | undefined,
  decorationType: vscode.TextEditorDecorationType
) {
  if (!editor) {
    return;
  }

  const decorations: vscode.DecorationOptions[] = [];

  const activeLineNumber = editor.selection.active.line;
  const document = editor.document;
  const activeLineNumberColor = getActiveLineNumberColor();
  const inactiveLineNumberColor = getInactiveLineNumberColor();
  const enableRainbow = getEnableRainbow();
  const centerColorOfRainbow = getColorAtCenterOfRainbow();

  const labelWidth = document.lineCount.toString().length;

  for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
    const lineRange = document.lineAt(lineIndex).range;
    const isCurrentLine = lineIndex === activeLineNumber;

    const label = isCurrentLine
      ? String(activeLineNumber + 1)
      : String(Math.abs(lineIndex - activeLineNumber));

    const rangeScope = new vscode.Range(lineRange.start, lineRange.start);
    const lineNumberStyle = {
      width: `${labelWidth / 2 + 0.5}em`,
      align: "right",
      contentText: label,
      color: isCurrentLine
        ? activeLineNumberColor
        : enableRainbow
        ? shiftHue(centerColorOfRainbow, Math.abs(lineIndex - activeLineNumber))
        : inactiveLineNumberColor,
      textDecoration: `
            box-sizing: border-box;
            text-align: right;
            padding-right: 1em;
          `,
      fontWeight: "bold",
    } as vscode.DecorationInstanceRenderOptions;
    const lineNumberAreaStyle: vscode.DecorationInstanceRenderOptions = {
      before: lineNumberStyle,
    } as vscode.DecorationInstanceRenderOptions;
    const decoration: vscode.DecorationOptions = {
      range: rangeScope,
      renderOptions: lineNumberAreaStyle,
    };

    decorations.push(decoration);
  }
  const enableRlativeLine = getEnableRelativeLineDefault();

  editor.setDecorations(decorationType, enableRlativeLine ? decorations : []);
}

function getConfig<T>(key: string, defaultValue: T) {
  const config = vscode.workspace.getConfiguration(nameOfExtension);
  return config.get<T>(key, defaultValue);
}

function getColorAtCenterOfRainbow() {
  return getConfig<string>("centerColorOfRainbow", defaultCenterColorOfRainbow);
}

function getColorAtActiveRowNumber() {
  return getConfig<string>("activeForeground", "");
}

function getColorAtInactiveRowNumber() {
  return getConfig<string>("foreground", "");
}

function getEnableRainbow() {
  return getConfig<boolean>("enableRainbow", false);
}

function updateUserConfig(key: string, set: any) {
  const extensionConfigs = vscode.workspace.getConfiguration(nameOfExtension);
  extensionConfigs.update(key, set, vsCodeGlobal);
}

function updateWorkspaceConfig(key: string, set: any) {
  const extensionConfigs = vscode.workspace.getConfiguration(nameOfExtension);
  extensionConfigs.update(key, set);
}

function updateEnableRainbowForWorkspace(set: boolean) {
  updateWorkspaceConfig("enableRainbow", set);
}

function updateEnableRainbowForUser(set: boolean) {
  updateUserConfig("enableRainbow", set);
}

function updateColorAtCenterOfRainbow(set: string) {
  const extensionConfigs = vscode.workspace.getConfiguration(nameOfExtension);
  extensionConfigs.update("centerColorOfRainbow", set);
}

function updateColorAtCenterOfRainbowForUser(set: string) {
  const extensionConfigs = vscode.workspace.getConfiguration(nameOfExtension);
  extensionConfigs.update("centerColorOfRainbow", set, vsCodeGlobal);
}

function updateColorAtActiveRowNumber(set: string) {
  const extensionConfigs = vscode.workspace.getConfiguration(nameOfExtension);
  extensionConfigs.update("activeForeground", set);
}

function updateColorAtActiveRowNumberForUser(set: string) {
  const extensionConfigs = vscode.workspace.getConfiguration(nameOfExtension);
  extensionConfigs.update("activeForeground", set, vsCodeGlobal);
}

function updateColorAtInactiveRowNumber(set: string) {
  const extensionConfigs = vscode.workspace.getConfiguration(nameOfExtension);
  extensionConfigs.update("foreground", set);
}

function updateColorAtInactiveRowNumberForUser(set: string) {
  const extensionConfigs = vscode.workspace.getConfiguration(nameOfExtension);
  extensionConfigs.update("foreground", set, vsCodeGlobal);
}

async function getColorCode(
  prompt: string,
  defaultValue: string,
  preValueGetter: () => string | undefined,
  setter: (set: string) => void
) {
  const preValue = preValueGetter() || defaultValue;
  const options: vscode.InputBoxOptions = {
    prompt: prompt,
    placeHolder: preValue,
  };
  const result = (await vscode.window.showInputBox(options)) || preValue;
  if (result === preValue || result === "") {
    return;
  }
  setter(result);
  vscode.window.showInformationMessage(`Color is updated by, ${result}!`);
}

async function getColorCodeAtCenterOfRainbow() {
  await getColorCode(
    "Please input color code at center of rainbow",
    defaultCenterColorOfRainbow,
    getColorAtCenterOfRainbow,
    updateColorAtCenterOfRainbow
  );
}

async function getColorCodeAtCenterOfRainbowForUser() {
  await getColorCode(
    "Please input color code at center of rainbow",
    defaultCenterColorOfRainbow,
    getColorAtCenterOfRainbow,
    updateColorAtCenterOfRainbowForUser
  );
}

async function getColorCodeAtActiveRowNumber() {
  await getColorCode(
    "Please input color code at active row number",
    "",
    getColorAtActiveRowNumber,
    updateColorAtActiveRowNumber
  );
}

async function getColorCodeAtActiveRowNumberForUser() {
  await getColorCode(
    "Please input color code at active row number",
    "",
    getColorAtActiveRowNumber,
    updateColorAtActiveRowNumberForUser
  );
}

async function getColorCodeAtInactiveRowNumber() {
  await getColorCode(
    "Please input color code at active row number",
    "",
    getColorAtInactiveRowNumber,
    updateColorAtInactiveRowNumber
  );
}

async function getColorCodeAtInactiveRowNumberForUser() {
  await getColorCode(
    "Please input color code at active row number",
    "",
    getColorAtInactiveRowNumber,
    updateColorAtInactiveRowNumberForUser
  );
}

function getEnableRelativeLineDefault() {
  return getConfig<boolean>("enableRlativeLineOnDefault", true);
}

function updateEnableRelativeLine(set: boolean) {
  updateWorkspaceConfig("enableRlativeLineOnDefault", set);
}

function updateEnableRelativeLineForUser(set: boolean) {
  updateUserConfig("enableRlativeLineOnDefault", set);
}

function getInactiveLineNumberColor() {
  const config = getConfig<string>("foreground", "");
  return config !== ""
    ? config
    : new vscode.ThemeColor("LineNumberDeco.foreground");
}

function getActiveLineNumberColor() {
  const config = getConfig<string>("activeForeground", "");

  return config !== ""
    ? config
    : new vscode.ThemeColor("LineNumberDeco.activeForeground");
}

function cmdCurry(command: string, callback: Function) {
  return vscode.commands.registerCommand(`line-number-deco.${command}`, () =>
    callback()
  );
}

const commands = [
  vscode.window.onDidChangeActiveTextEditor((e) => {
    updateRelativeLineNumbers(e, decorationType);
  }),
  vscode.window.onDidChangeTextEditorSelection((e) => {
    updateRelativeLineNumbers(e.textEditor, decorationType);
  }),
  cmdCurry("enableRelativeLineNumbers", () => updateEnableRelativeLine(true)),
  cmdCurry("enableRelativeLineNumbersForUser", () =>
    updateEnableRelativeLineForUser(true)
  ),
  cmdCurry("disableRelativeLineNumbers", () => updateEnableRelativeLine(false)),
  cmdCurry("disableRelativeLineNumbersForUser", () =>
    updateEnableRelativeLineForUser(false)
  ),
  cmdCurry("enableRainbow", () => updateEnableRainbowForWorkspace(true)),
  cmdCurry("enableRainbowForUser", () => updateEnableRainbowForUser(true)),
  cmdCurry("disableRainbow", () => updateEnableRainbowForWorkspace(false)),
  cmdCurry("disableRainbowForUser", () => updateEnableRainbowForUser(false)),
  cmdCurry("updateColorAtCenterOfRainbow", () =>
    getColorCodeAtCenterOfRainbow()
  ),
  cmdCurry("updateColorAtCenterOfRainbowForUser", () =>
    getColorCodeAtCenterOfRainbowForUser()
  ),
  cmdCurry("updateColorAtActiveRowNumber", () => getColorCodeAtActiveRowNumber()),
  cmdCurry("updateColorAtActiveRowNumberForUser", () => getColorCodeAtActiveRowNumberForUser()),
  cmdCurry("updateColorAtInactiveRowNumber", () => getColorCodeAtInactiveRowNumber()),
  cmdCurry("updateColorAtInactiveRowNumberForUser", () => getColorCodeAtInactiveRowNumberForUser()),
];

/**
 * activate extension
 * @param context
 */
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(...commands);
}

/**
 * deactivate extension
 */
export function deactivate() {}
