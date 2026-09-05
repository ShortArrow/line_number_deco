import * as fs from "fs";
import * as path from "path";
import { By, WebElement } from "selenium-webdriver";
import { ActivityBar, SideBarView, VSBrowser, WebviewView } from "vscode-extension-tester";
import * as assert from "assert";

/**
 * The setting the segmented control edits, and the row that holds it.
 *
 * The panel offers this one setting of the editor rather than of this
 * extension, so it is the row whose click has to survive a state message.
 */
const selectKey = "editor.lineNumbers";

/** How long a staged choice is given to be overwritten before it counts as kept. */
const settleMs = 2000;

/** How long the webview iframe is given to appear in the sidebar. */
const frameTimeoutMs = 30000;

/**
 * The user settings file of the VS Code instance under test.
 *
 * ExTester points the instance at `<storage>/settings` with --user-data-dir
 * and exports the storage folder as TEST_RESOURCES, so the file the panel
 * would write to is reachable from the test's own node process.
 */
function userSettingsPath(): string {
  const storage = process.env.TEST_RESOURCES ?? path.resolve(".resources");
  return path.join(storage, "settings", "User", "settings.json");
}

/** Every setting the instance has saved, or nothing when the file is absent. */
function savedSettings(): Record<string, unknown> {
  const file = userSettingsPath();
  if (!fs.existsSync(file)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;
}

describe("settings panel segmented control", function () {
  this.timeout(240000);

  let view: InstanceType<typeof WebviewView>;
  let savedOption: string;

  /** The option a segment stands for, whether or not it is the current one. */
  async function optionValue(segment: WebElement): Promise<string> {
    return (await segment.getAttribute("data-value")) ?? "";
  }

  /** Every segment of the select row, in the order the panel renders them. */
  async function segments(): Promise<WebElement[]> {
    return await view.findWebElements(
      By.css(`[data-select-for="${selectKey}"]`)
    );
  }

  /** The one segment standing for a given option. */
  async function segmentFor(value: string): Promise<WebElement> {
    for (const segment of await segments()) {
      if ((await optionValue(segment)) === value) {
        return segment;
      }
    }
    throw new Error(`no segment for option ${value}`);
  }

  /** The option currently marked, which is the staged one when there is one. */
  async function markedOption(): Promise<string | undefined> {
    for (const segment of await segments()) {
      if ((await segment.getAttribute("data-current")) === "true") {
        return await optionValue(segment);
      }
    }
    return undefined;
  }

  /** Whether the row is showing the staged-value marker. */
  async function rowIsPending(): Promise<boolean> {
    const row = await view.findWebElement(By.css(`[data-row="${selectKey}"]`));
    const klass = (await row.getAttribute("class")) ?? "";
    return klass.split(/\s+/).includes("pending");
  }

  before(async function () {
    const control = await new ActivityBar().getViewControl("LineNumberDeco");
    assert.ok(control, "the extension contributes no LineNumberDeco view container");
    await control.openView();
    const sideBar = new SideBarView();
    await VSBrowser.instance.driver.wait(
      async () => await sideBar.isDisplayed(),
      frameTimeoutMs,
      "the sidebar never showed the settings view"
    );
    view = new WebviewView(sideBar);
    await view.switchToFrame(frameTimeoutMs);
  });

  after(async function () {
    await view?.switchBack();
  });

  it("U1 keeps the clicked option marked after a state message could bounce it", async function () {
    const opened = await markedOption();
    assert.ok(opened, "no option carried data-current when the panel opened");
    savedOption = opened;

    // Any option other than the open one: clicking the current one would stage
    // nothing and the bounce would have nothing to undo.
    const target = savedOption === "relative" ? "off" : "relative";
    await (await segmentFor(target)).click();

    // Deliberately a sleep, not a wait: the bug is a message arriving late and
    // overwriting the choice, so the assertion has to be made after any such
    // message could have landed, not at the first moment it looks right.
    await VSBrowser.instance.driver.sleep(settleMs);

    assert.strictEqual(
      await markedOption(),
      target,
      "the clicked option lost data-current — the staged choice bounced back"
    );
    assert.notStrictEqual(
      await (await segmentFor(savedOption)).getAttribute("data-current"),
      "true",
      "the previously current option is still marked"
    );
  });

  it("U2 marks the row as holding a staged value", async function () {
    assert.strictEqual(
      await rowIsPending(),
      true,
      "the row does not show the staged-value marker after the click"
    );
  });

  it("U4 saves nothing until the choice is applied", async function () {
    const saved = savedSettings();
    assert.ok(
      !(selectKey in saved),
      `${selectKey} was written to ${userSettingsPath()} by a click that only stages: ` +
        JSON.stringify(saved[selectKey])
    );
  });

  it("U3 restores the saved option when the row is reset", async function () {
    await (await view.findWebElement(By.css(`[data-reset="${selectKey}"]`))).click();

    await VSBrowser.instance.driver.wait(
      async () => (await markedOption()) === savedOption && !(await rowIsPending()),
      settleMs,
      "the reset did not restore the saved option and clear the staged marker"
    );

    assert.strictEqual(await markedOption(), savedOption);
    assert.strictEqual(await rowIsPending(), false);
  });
});
