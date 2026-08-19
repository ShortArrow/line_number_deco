const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

const EXTENSION_ID = 'ShortArrow.line-number-deco';

const EXPECTED_COMMANDS = [
  'line-number-deco.enableRainbow',
  'line-number-deco.disableRainbow',
  'line-number-deco.enableRainbowForUser',
  'line-number-deco.disableRainbowForUser'
];

/**
 * Reads a required environment variable.
 * @throws {Error} when the variable is unset or empty.
 */
function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`missing required environment variable ${name}`);
  }
  return value;
}

/** Collects the failures of C2-C5, which only make sense once the extension is present. */
async function checkInstalledExtension(ext, expectVersion, extensionsDir) {
  const failures = [];

  const actualPath = fs.realpathSync(ext.extensionPath);
  const expectedPrefix = fs.realpathSync(extensionsDir) + path.sep;
  if (!actualPath.startsWith(expectedPrefix)) {
    failures.push(
      `extension was loaded from ${actualPath}, which is not inside the smoke extensions dir ${expectedPrefix}`
    );
  }

  const actualVersion = ext.packageJSON.version;
  if (actualVersion !== expectVersion) {
    failures.push(`extension version is ${actualVersion}, expected ${expectVersion}`);
  }

  try {
    await ext.activate();
  } catch (error) {
    failures.push(`activate() rejected: ${error && error.stack ? error.stack : error}`);
  }
  if (!ext.isActive) {
    failures.push('extension is not active after activate() resolved');
  }

  const commands = await vscode.commands.getCommands(true);
  const missing = EXPECTED_COMMANDS.filter((command) => !commands.includes(command));
  if (missing.length > 0) {
    failures.push(`commands not registered: ${missing.join(', ')}`);
  }

  return failures;
}

/** Writes the result file the driver reads, creating its parent directory. */
function writeResult(resultFile, failures) {
  fs.mkdirSync(path.dirname(resultFile), { recursive: true });
  fs.writeFileSync(
    resultFile,
    JSON.stringify({ ok: failures.length === 0, failures }, null, 2)
  );
}

/**
 * Asserts that the VSIX under test is the extension VS Code loaded, at the
 * expected version, and that it activates with its commands registered.
 * @returns {Promise<void>} resolves when every check passed.
 */
async function run() {
  const expectVersion = requireEnv('SMOKE_EXPECT_VERSION');
  const extensionsDir = requireEnv('SMOKE_EXTENSIONS_DIR');
  const resultFile = requireEnv('SMOKE_RESULT_FILE');

  let failures;
  const ext = vscode.extensions.getExtension(EXTENSION_ID);
  if (!ext) {
    failures = [`extension ${EXTENSION_ID} is not installed`];
  } else {
    failures = await checkInstalledExtension(ext, expectVersion, extensionsDir);
  }

  writeResult(resultFile, failures);

  if (failures.length > 0) {
    throw new Error(failures.join('\n'));
  }
}

exports.run = run;
