import * as fs from "fs";
import * as path from "path";
import * as assert from "assert";
import { ActivityBar, SideBarView, VSBrowser, WebviewView } from "vscode-extension-tester";

/** How long the webview iframe is given to appear in the sidebar. */
const frameTimeoutMs = 30000;

/** How long a theme switch is given to reach the webview. */
const themeTimeoutMs = 15000;

/**
 * WCAG 2.1 SC 1.4.11: a state indicator needs 3:1 against what it sits on.
 */
const minimumContrast = 3;

/** The built-in themes, with the class VS Code puts on the webview body for each. */
const themes: Array<{ name: string; bodyClass: string }> = [
  { name: "Dark Modern", bodyClass: "vscode-dark" },
  { name: "Light Modern", bodyClass: "vscode-light" },
  { name: "Default High Contrast", bodyClass: "vscode-high-contrast" },
  { name: "Default High Contrast Light", bodyClass: "vscode-high-contrast-light" },
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

/** WCAG 2 relative luminance of an `rgb()`/`rgba()` string, or undefined when it is fully transparent. */
function luminance(color: string): number | undefined {
  const parts = color.match(/[\d.]+/g)?.map(Number);
  if (!parts || parts.length < 3 || parts[3] === 0) {
    return undefined;
  }
  const [r, g, b] = parts.slice(0, 3).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(first: string, second: string): number {
  const a = luminance(first);
  const b = luminance(second);
  if (a === undefined || b === undefined) {
    return 1;
  }
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** The colors that can tell an element apart from the panel: its fill and, when drawn, its outline. */
interface Marks {
  fill: string;
  outline: string;
}

/** How strongly an element's own marks stand out from the panel background. */
function strongest(marks: Marks, background: string): number {
  return Math.max(contrast(marks.fill, background), contrast(marks.outline, background));
}

describe("settings panel state indicators in every theme", function () {
  this.timeout(240000);

  let view: InstanceType<typeof WebviewView>;
  let original: Record<string, unknown>;
  const driver = () => VSBrowser.instance.driver;

  async function enterPanel() {
    const control = await new ActivityBar().getViewControl("LineNumberDeco");
    assert.ok(control, "the extension contributes no LineNumberDeco view container");
    await control.openView();
    const sideBar = new SideBarView();
    await driver().wait(async () => await sideBar.isDisplayed(), frameTimeoutMs, "the sidebar never showed the settings view");
    view = new WebviewView(sideBar);
    await view.switchToFrame(frameTimeoutMs);
  }

  /** Read the panel background and the marks of the on-state switch track and the current segment. */
  async function readIndicators() {
    return await driver().executeScript<{ background: string; track: Marks; segment: Marks }>(`
      const marks = (element, pseudo) => {
        const style = getComputedStyle(element, pseudo);
        const drawn = style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
        const bordered = style.borderTopStyle !== "none" && parseFloat(style.borderTopWidth) > 0;
        return {
          fill: style.backgroundColor,
          outline: drawn ? style.outlineColor : bordered ? style.borderTopColor : "rgba(0, 0, 0, 0)",
        };
      };
      const root = getComputedStyle(document.documentElement);
      const background = root.getPropertyValue("--vscode-sideBar-background").trim()
        || root.getPropertyValue("--vscode-editor-background").trim();
      const probe = document.createElement("div");
      probe.style.backgroundColor = background;
      document.body.appendChild(probe);
      const resolved = getComputedStyle(probe).backgroundColor;
      probe.remove();
      const checked = [...document.querySelectorAll('.switch input')].find((input) => input.checked);
      const current = document.querySelector('.segment[data-current="true"]');
      return {
        background: resolved,
        track: marks(checked.nextElementSibling),
        segment: marks(current),
      };
    `);
  }

  before(async function () {
    original = readSettings();
    await enterPanel();
  });

  after(async function () {
    await view?.switchBack();
    writeSettings(original);
  });

  for (const theme of themes) {
    it(`Must show which switch is on and which option is current in ${theme.name}`, async function () {
      await view.switchBack();
      writeSettings({ ...original, "workbench.colorTheme": theme.name });
      await view.switchToFrame(frameTimeoutMs);
      await driver().wait(
        async () => ((await driver().executeScript<string>("return document.body.className;")) ?? "").split(/\s+/).includes(theme.bodyClass),
        themeTimeoutMs,
        `the webview never took ${theme.name}`
      );
      const { background, track, segment } = await readIndicators();
      const trackContrast = strongest(track, background);
      const segmentContrast = strongest(segment, background);
      assert.ok(
        trackContrast >= minimumContrast,
        `an on switch is ${trackContrast.toFixed(2)}:1 against ${background} (fill ${track.fill}, outline ${track.outline})`
      );
      assert.ok(
        segmentContrast >= minimumContrast,
        `the current option is ${segmentContrast.toFixed(2)}:1 against ${background} (fill ${segment.fill}, outline ${segment.outline})`
      );
    });
  }
});
