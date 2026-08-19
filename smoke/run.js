const cp = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  downloadAndUnzipVSCode,
  resolveCliArgsFromVSCodeExecutablePath,
  runTests
} = require('@vscode/test-electron');

const USAGE = 'usage: node run.js --expect-version <X.Y.Z> [--vsix <path>]';

const EXIT_OK = 0;
const EXIT_SMOKE_FAILED = 1;
const EXIT_HARNESS_BROKEN = 2;

/** A command line the driver cannot act on; reported with the usage text. */
class UsageError extends Error {}

/**
 * @returns {{ expectVersion: string, vsix: string | undefined }}
 * @throws {UsageError} on an unknown flag, a missing value or a missing --expect-version.
 */
function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag !== '--expect-version' && flag !== '--vsix') {
      throw new UsageError(`unknown argument ${flag}`);
    }
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      throw new UsageError(`${flag} needs a value`);
    }
    parsed[flag === '--vsix' ? 'vsix' : 'expectVersion'] = value;
    i += 1;
  }
  if (!parsed.expectVersion) {
    throw new UsageError('--expect-version is required');
  }
  return parsed;
}

/** Creates a throwaway VS Code profile: no user data, no extensions, no result yet. */
function createTempProfile() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lnd-smoke-'));
  const userDataDir = path.join(root, 'user-data');
  const extensionsDir = path.join(root, 'extensions');
  fs.mkdirSync(userDataDir);
  fs.mkdirSync(extensionsDir);
  return { root, userDataDir, extensionsDir, resultFile: path.join(root, 'result.json') };
}

/** @throws {Error} when the VS Code CLI reports a non-zero status. */
function installVsix(vscodeExecutablePath, vsix, userDataDir, extensionsDir) {
  const [cli, ...cliArgs] = resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);
  const result = cp.spawnSync(
    cli,
    [
      ...cliArgs,
      '--user-data-dir',
      userDataDir,
      '--extensions-dir',
      extensionsDir,
      '--install-extension',
      path.resolve(vsix)
    ],
    { stdio: 'inherit', shell: process.platform === 'win32' }
  );
  if (result.status !== 0) {
    throw new Error('vsix install failed');
  }
}

/** @returns {{ ok: boolean, failures: string[] } | undefined} undefined when unreadable. */
function readResult(resultFile) {
  try {
    return JSON.parse(fs.readFileSync(resultFile, 'utf8'));
  } catch {
    return undefined;
  }
}

async function main() {
  const { expectVersion, vsix } = parseArgs(process.argv.slice(2));

  const vscodeExecutablePath = await downloadAndUnzipVSCode({
    cachePath: path.join(__dirname, '.vscode-test')
  });

  const { root, userDataDir, extensionsDir, resultFile } = createTempProfile();
  console.log(`smoke profile: ${root}`);

  if (vsix) {
    installVsix(vscodeExecutablePath, vsix, userDataDir, extensionsDir);
  }

  try {
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath: path.join(__dirname, 'host-extension'),
      extensionTestsPath: path.join(__dirname, 'host-extension', 'suite', 'index.js'),
      launchArgs: ['--user-data-dir', userDataDir, '--extensions-dir', extensionsDir],
      extensionTestsEnv: {
        SMOKE_EXPECT_VERSION: expectVersion,
        SMOKE_EXTENSIONS_DIR: extensionsDir,
        SMOKE_RESULT_FILE: resultFile
      }
    });
  } catch {
    // The result file is the source of truth; a rejection here only mirrors it.
  }

  const result = readResult(resultFile);
  if (!result || typeof result.ok !== 'boolean') {
    console.error('smoke harness did not produce a result');
    return EXIT_HARNESS_BROKEN;
  }
  if (result.ok) {
    console.log('smoke OK');
    return EXIT_OK;
  }
  for (const failure of result.failures) {
    console.error(`smoke FAIL: ${failure}`);
  }
  return EXIT_SMOKE_FAILED;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    console.error(error && error.message ? error.message : error);
    if (error instanceof UsageError) {
      console.error(USAGE);
    }
    process.exitCode = EXIT_HARNESS_BROKEN;
  }
);
