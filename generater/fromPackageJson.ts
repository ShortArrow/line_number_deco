import { readFile } from 'fs/promises';
import { writeFile } from 'fs/promises';

function getFilePath() {
  return 'package.json';
}

async function getKeyValue(key: string): Promise<string | null> {
  try {
    // read the file asynchronously
    const fileContent = await readFile(getFilePath(), 'utf8');
    // parse the read JSON into an object
    const json = JSON.parse(fileContent);
    // return the value of the specified key
    return json[key] || null;
  } catch (error) {
    console.error('Error reading or parsing JSON file:', error);
    return null;
  }
}

async function readCommands(): Promise<any[] | null> {
  try {
    // read the file asynchronously
    const fileContent = await readFile(getFilePath(), 'utf8');
    // parse the read JSON into an object
    const json = JSON.parse(fileContent);
    // return the 'contributes.commands' array
    return json.contributes?.commands || null;
  } catch (error) {
    console.error('Error reading or parsing JSON file:', error);
    return null;
  }
}

async function getExtensionName() {
  const name = await getKeyValue('name');
  return name || 'No name found';
}

async function generateFile(outputPath: string) {
  const commands = await readCommands();
  if (!commands) {
    throw new Error('No extension commands found');
  }
  const thisExtension = (await getExtensionName())
    .replace(/-(.)/g, (_match: string, group1: string) => group1.toUpperCase())
    .replace(/^(.)/, (match: string) => match.toUpperCase());
  const warning = `// This file is generated from package.json.\n// Do not modify this file manually.\n\n`;
  const importVscode = `import * as vscode from "vscode";\n\n`;
  const classHeader = `export class ${thisExtension} {\n`;
  const classFooter = `\n}`;
  const lines = commands.map((command: any) => {
    const { command: name, title } = command;
    const commandName = name.split('.').pop();
    return (
      `  /**
   * ${title}
   */   
  static ${commandName}(callback: Function) {
    return vscode.commands.registerCommand(\'${name}\', () =>
      callback()
    );
  }`
    );
  });
  const content =
    warning +
    importVscode +
    classHeader +
    lines.join('\n\n') +
    classFooter;
  await writeFile(outputPath, content);
}

generateFile('./src/generated/generated.ts');