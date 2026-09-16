/**
 * Regenerate everything that transcribes the `contributes` block of
 * `package.json`: the command wrapper class the extension imports, and the two
 * reference tables under `docs/`.
 *
 * A transcription rots silently, so it is written by a script and checked by
 * `src/test/docs.test.ts` in both directions.
 */

import { readFile, writeFile } from 'fs/promises';

type ContributedCommand = { command: string; title: string };

type ContributedProperty = {
  type: string;
  format?: string;
  default?: unknown;
  description?: string;
};

type Manifest = {
  name?: string;
  contributes?: {
    commands?: ContributedCommand[];
    configuration?: { properties?: Record<string, ContributedProperty> };
  };
};

const manifestPath = 'package.json';
const generatedClassPath = './src/generated/generated.ts';
const commandsDocPath = './docs/commands.md';
const settingsDocPath = './docs/settings.md';

async function readManifest(): Promise<Manifest> {
  return JSON.parse(await readFile(manifestPath, 'utf8'));
}

/**
 * The class name the extension imports, derived from the package name:
 * `line-number-deco` becomes `LineNumberDeco`.
 */
function classNameOf(packageName: string): string {
  return packageName
    .replace(/-(.)/g, (_match: string, letter: string) => letter.toUpperCase())
    .replace(/^(.)/, (letter: string) => letter.toUpperCase());
}

function renderCommandClass(className: string, commands: ContributedCommand[]): string {
  const methods = commands.map(({ command, title }) => {
    const methodName = command.split('.').pop();
    return `  /**
   * ${title}
   */
  static ${methodName}(callback: Function) {
    return vscode.commands.registerCommand('${command}', () =>
      callback()
    );
  }`;
  });
  return (
    '// This file is generated from package.json.\n' +
    '// Do not modify this file manually.\n\n' +
    'import * as vscode from "vscode";\n\n' +
    `export class ${className} {\n` +
    methods.join('\n\n') +
    '\n}'
  );
}

function renderCommandsDoc(commands: ContributedCommand[]): string {
  const rows = commands.map(
    ({ command, title }) => `| \`${command}\` | ${title} |`
  );
  return `# Commands

Every command of the extension, with the id to use from a keybinding or \`init.lua\`. Workspace variants write to the current workspace; \`ForUser\` variants write to your user settings.

| Command | Title |
| --- | --- |
${rows.join('\n')}

Calling one from [VSCode Neovim](https://marketplace.visualstudio.com/items?itemName=asvetliakov.vscode-neovim):

\`\`\`lua
vim.fn.VSCodeNotify('line-number-deco.toggleSettingsPanel')
\`\`\`
`;
}

/**
 * A color key is declared as a string with `"format": "color"`, and the table
 * names that format rather than the JSON type, because the format is what
 * decides whether `settings.json` offers a color picker.
 */
function typeOf(property: ContributedProperty): string {
  return property.format === 'color' ? 'color' : property.type;
}

/**
 * An empty default on a color key means the theme decides, so the table says
 * so instead of showing an empty cell.
 */
function defaultOf(property: ContributedProperty): string {
  if (typeOf(property) === 'color' && property.default === '') {
    return '(theme color)';
  }
  return `\`${JSON.stringify(property.default)}\``.replace(/"/g, '');
}

function renderSettingsDoc(properties: Record<string, ContributedProperty>): string {
  const rows = Object.entries(properties).map(
    ([key, property]) =>
      `| \`${key}\` | ${typeOf(property)} | ${defaultOf(property)} | ${property.description ?? ''} |`
  );
  return `# Settings

Every configuration key of the extension. All of them are also editable from the settings panel in the activity bar.

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
${rows.join('\n')}
`;
}

async function generate(): Promise<void> {
  const manifest = await readManifest();
  const commands = manifest.contributes?.commands;
  if (!commands) {
    throw new Error('No extension commands found');
  }
  const properties = manifest.contributes?.configuration?.properties;
  if (!properties) {
    throw new Error('No extension configuration properties found');
  }
  const className = classNameOf(manifest.name ?? 'extension');
  await writeFile(generatedClassPath, renderCommandClass(className, commands));
  await writeFile(commandsDocPath, renderCommandsDoc(commands));
  await writeFile(settingsDocPath, renderSettingsDoc(properties));
}

generate();
