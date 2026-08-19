const fs = require('fs');
const path = require('path');

const USAGE = 'usage: node inspect-vsix.js <unzipped-dir> <expected-version>';

const FORBIDDEN_PREFIXES = [
  'src/',
  'out/test/',
  'out/generater/',
  'smoke/',
  '.github/',
  'node_modules/'
];

const FORBIDDEN_FILES = ['pnpm-lock.yaml', 'pnpm-workspace.yaml', 'yarn.lock'];

/** @returns {string[]} every file path under dir, relative to it, with forward slashes. */
function walk(dir, prefix = '') {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...walk(path.join(dir, entry.name), relative));
    } else {
      files.push(relative);
    }
  }
  return files;
}

function isFile(candidate) {
  return fs.existsSync(candidate) && fs.statSync(candidate).isFile();
}

/** I1: the VSIX envelope survived the unzip. */
function checkEnvelope(dir, failures) {
  for (const name of ['extension.vsixmanifest', '[Content_Types].xml']) {
    if (!isFile(path.join(dir, name))) {
      failures.push(`missing ${name}`);
    }
  }
}

/** I2: the manifest identifies the extension under test at the expected version. */
function readManifest(extensionDir, expectedVersion, failures) {
  const manifestPath = path.join(extensionDir, 'package.json');
  if (!isFile(manifestPath)) {
    failures.push('missing extension/package.json');
    return undefined;
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    failures.push(`extension/package.json is not valid JSON: ${error.message}`);
    return undefined;
  }

  if (manifest.version !== expectedVersion) {
    failures.push(`version is ${manifest.version}, expected ${expectedVersion}`);
  }
  if (manifest.name !== 'line-number-deco') {
    failures.push(`name is ${manifest.name}, expected line-number-deco`);
  }
  if (manifest.publisher !== 'ShortArrow') {
    failures.push(`publisher is ${manifest.publisher}, expected ShortArrow`);
  }
  return manifest;
}

/** I3: the entry point named by the manifest is really shipped and has content. */
function checkMain(extensionDir, manifest, failures) {
  if (!manifest || !manifest.main) {
    failures.push('extension/package.json has no main');
    return;
  }
  const mainPath = path.join(extensionDir, manifest.main);
  if (!isFile(mainPath)) {
    failures.push(`main ${manifest.main} does not exist`);
    return;
  }
  if (fs.statSync(mainPath).size === 0) {
    failures.push(`main ${manifest.main} is empty`);
  }
}

/** I4: nothing that belongs to development leaked into the package. */
function checkNoDevelopmentFiles(files, failures) {
  for (const file of files) {
    const prefix = FORBIDDEN_PREFIXES.find((candidate) => file.startsWith(candidate));
    if (prefix) {
      failures.push(`packaged file ${file} is under ${prefix}`);
    }
    if (FORBIDDEN_FILES.includes(file)) {
      failures.push(`packaged file ${file} should not ship`);
    }
  }
}

/** I5: the generated table extension.js imports at runtime is present. */
function checkGenerated(extensionDir, failures) {
  if (!isFile(path.join(extensionDir, 'out', 'generated', 'generated.js'))) {
    failures.push('missing out/generated/generated.js');
  }
}

function main(argv) {
  const [dir, expectedVersion] = argv;
  if (!dir || !expectedVersion) {
    console.error(USAGE);
    return 2;
  }
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    console.error(`inspect FAIL: ${dir} is not a directory`);
    return 1;
  }

  const failures = [];
  const extensionDir = path.join(dir, 'extension');

  checkEnvelope(dir, failures);

  if (!fs.existsSync(extensionDir)) {
    failures.push('missing extension/ directory');
    for (const failure of failures) {
      console.error(`inspect FAIL: ${failure}`);
    }
    return 1;
  }

  const manifest = readManifest(extensionDir, expectedVersion, failures);
  checkMain(extensionDir, manifest, failures);

  const files = walk(extensionDir);
  checkNoDevelopmentFiles(files, failures);
  checkGenerated(extensionDir, failures);

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`inspect FAIL: ${failure}`);
    }
    return 1;
  }
  console.log(`inspect OK (${files.length} files)`);
  return 0;
}

process.exitCode = main(process.argv.slice(2));
