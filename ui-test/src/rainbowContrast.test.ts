import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as assert from "assert";
import { VSBrowser } from "vscode-extension-tester";

/** How long a theme switch is given to reach the editor and repaint the numbers. */
const themeTimeoutMs = 15000;

/** WCAG 2.1 SC 1.4.3: text needs 4.5:1 against what it sits on. */
const minimumContrast = 4.5;

/** The built-in themes, with the class VS Code puts on the workbench for each. */
const themes: Array<{ name: string; workbenchClass: string }> = [
  { name: "Dark Modern", workbenchClass: "vs-dark" },
  { name: "Light Modern", workbenchClass: "vs" },
  { name: "Default High Contrast", workbenchClass: "hc-black" },
  { name: "Default High Contrast Light", workbenchClass: "hc-light" },
];

function userSettingsPath(): string {
  const storage = process.env.TEST_RESOURCES ?? path.resolve(".resources");
  return path.join(storage, "settings", "User", "settings.json");
}

function readSettings(): Record<string, unknown> {
  const file = userSettingsPath();
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>) : {};
}

function writeSettings(settings: Record<string, unknown>) {
  fs.mkdirSync(path.dirname(userSettingsPath()), { recursive: true });
  fs.writeFileSync(userSettingsPath(), JSON.stringify(settings, null, 2));
}

/** One painted line number: its label, its color and the editor background, as the page resolved them. */
interface Painted {
  label: string;
  color: string;
  background: string;
}

/** WCAG 2 relative luminance of an `rgb()` string. */
function luminance(color: string): number {
  const [r, g, b] = (color.match(/[\d.]+/g) ?? []).slice(0, 3).map((channel) => {
    const c = Number(channel) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(first: string, second: string): number {
  const [a, b] = [luminance(first), luminance(second)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe("rainbow line numbers in every theme", function () {
  this.timeout(240000);

  let original: Record<string, unknown>;
  let file: string;
  const driver = () => VSBrowser.instance.driver;

  /**
   * Every rainbow number on screen, the cursor's line left out: the numbers are
   * the `::before` content of spans in the view lines, and the topmost one is
   * the cursor's, which takes the active color rather than the rainbow.
   */
  async function readNumbers(): Promise<Painted[]> {
    return await driver().executeScript<Painted[]>(`
      const editor = document.querySelector(".monaco-editor .monaco-editor-background");
      const background = editor ? getComputedStyle(editor).backgroundColor : "";
      const painted = [...document.querySelectorAll(".monaco-editor .view-lines span")]
        .map((span) => ({ span, style: getComputedStyle(span, "::before") }))
        .filter(({ style }) => /^"\\d+"$/.test(style.content))
        .map(({ span, style }) => ({
          top: span.getBoundingClientRect().top,
          label: style.content.slice(1, -1),
          color: style.color,
          background,
        }))
        .sort((a, b) => a.top - b.top);
      return painted.slice(1).map(({ label, color, background }) => ({ label, color, background }));
    `);
  }

  before(async function () {
    original = readSettings();
    file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "rainbow-")), "lines.txt");
    fs.writeFileSync(file, Array.from({ length: 40 }, (_, index) => `line ${index + 1}`).join("\n"));
    writeSettings({ ...original, "LineNumberDeco.enableRainbow": true, "workbench.colorTheme": themes[0].name });
    await VSBrowser.instance.openResources(file);
    await driver().wait(async () => (await readNumbers()).length >= 16, themeTimeoutMs, "the rainbow never painted 16 numbers");
  });

  after(async function () {
    writeSettings(original);
  });

  for (const theme of themes) {
    it(`Must keep every rainbow number readable in ${theme.name}`, async function () {
      writeSettings({ ...original, "LineNumberDeco.enableRainbow": true, "workbench.colorTheme": theme.name });
      await driver().wait(
        async () => ((await driver().executeScript<string>(`return document.querySelector(".monaco-workbench").className;`)) ?? "").split(/\s+/).includes(theme.workbenchClass),
        themeTimeoutMs,
        `the workbench never took ${theme.name}`
      );
      const unreadable = async () =>
        (await readNumbers()).filter(({ color, background }) => contrast(color, background) < minimumContrast);
      try {
        await driver().wait(async () => (await unreadable()).length === 0, themeTimeoutMs);
      } catch {
        // The assertion below names what stayed unreadable.
      }
      const left = await unreadable();
      assert.deepStrictEqual(
        left.map(({ label, color, background }) => `${label} ${color} on ${background} is ${contrast(color, background).toFixed(2)}:1`),
        []
      );
    });
  }
});
