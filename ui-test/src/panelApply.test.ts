import * as fs from "fs";
import * as path from "path";
import { By, WebElement } from "selenium-webdriver";
import { ActivityBar, SideBarView, VSBrowser, WebviewView } from "vscode-extension-tester";
import * as assert from "assert";

/**
 * Apply, Apply all and the scope radio in a real window.
 *
 * Saves are fast, so the clicks that have to land while one is in flight are
 * made in one script inside the webview: everything the script does reaches
 * the extension as the same messages a reader's clicks would post, before the
 * first of them can be answered.
 */

/** How long a late state message is given to undo something before it counts as kept. */
const settleMs = 2000;

/** How long the webview iframe is given to appear in the sidebar. */
const frameTimeoutMs = 30000;

/** How long a save is given to reach the settings file. */
const saveTimeoutMs = 10000;

/** The user settings file of the VS Code instance under test; see panel.test.ts. */
function userSettingsPath(): string {
  const storage = process.env.TEST_RESOURCES ?? path.resolve(".resources");
  return path.join(storage, "settings", "User", "settings.json");
}

function savedSettings(): Record<string, unknown> {
  const file = userSettingsPath();
  if (!fs.existsSync(file)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;
  } catch {
    // Caught mid-write; the next poll reads the finished file.
    return {};
  }
}

function savedColor(key: string): unknown {
  return savedSettings()[`LineNumberDeco.${key}`];
}

describe("settings panel apply", function () {
  this.timeout(240000);

  let view: InstanceType<typeof WebviewView>;
  const driver = () => VSBrowser.instance.driver;

  async function enterPanel() {
    const control = await new ActivityBar().getViewControl("LineNumberDeco");
    assert.ok(control, "the extension contributes no LineNumberDeco view container");
    await control.openView();
    const sideBar = new SideBarView();
    await driver().wait(
      async () => await sideBar.isDisplayed(),
      frameTimeoutMs,
      "the sidebar never showed the settings view"
    );
    view = new WebviewView(sideBar);
    await view.switchToFrame(frameTimeoutMs);
  }

  async function hexField(key: string): Promise<WebElement> {
    return await view.findWebElement(By.css(`[data-hex-for="${key}"]`));
  }

  /** Type a color into a row's hex field, as a reader would, and wait for the row to show it staged. */
  async function stageByTyping(key: string, hex: string) {
    const field = await hexField(key);
    await field.clear();
    await field.sendKeys(hex);
    await driver().wait(
      async () => await rowIsPending(key),
      settleMs,
      `typing ${hex} into ${key} did not stage it`
    );
  }

  async function rowIsPending(key: string): Promise<boolean> {
    const row = await view.findWebElement(By.css(`[data-row="${key}"]`));
    return ((await row.getAttribute("class")) ?? "").split(/\s+/).includes("pending");
  }

  async function shownHex(key: string): Promise<string> {
    return await driver().executeScript<string>(
      "return document.querySelector('[data-hex-for=\"' + arguments[0] + '\"]').value;",
      key
    );
  }

  async function waitForSaved(key: string, hex: string) {
    await driver().wait(
      async () => savedColor(key) === hex,
      saveTimeoutMs,
      `${key} never reached the settings file as ${hex}; it holds ${JSON.stringify(savedColor(key))}`
    );
  }

  async function resetRow(key: string) {
    await (await view.findWebElement(By.css(`[data-reset="${key}"]`))).click();
    await driver().wait(async () => !(await rowIsPending(key)), settleMs);
  }

  before(async function () {
    await enterPanel();
  });

  after(async function () {
    await view?.switchBack();
  });

  it("U10 opens on User with the Workspace radio disabled when no folder is open", async function () {
    const workspace = await view.findWebElement(By.css('input[name="scope"][value="workspace"]'));
    const user = await view.findWebElement(By.css('input[name="scope"][value="user"]'));
    assert.strictEqual(await workspace.isEnabled(), false, "the Workspace radio can be picked with no folder open");
    assert.strictEqual(await user.isSelected(), true, "the User radio is not selected");
    const markup = await driver().executeScript<{ userDefault: boolean; title: string }>(
      "var w = document.querySelector('input[name=\"scope\"][value=\"workspace\"]');" +
        "var u = document.querySelector('input[name=\"scope\"][value=\"user\"]');" +
        "return { userDefault: u.defaultChecked, title: w.closest('label').title };"
    );
    assert.strictEqual(markup.userDefault, true, "the panel was not rendered with User checked");
    assert.strictEqual(markup.title, "Open a folder to edit Workspace settings");
  });

  it("U7 keeps a color staged during Apply all's save, and saves what Apply all covered", async function () {
    await stageByTyping("centerColorOfRainbow", "#a1a1a1");
    await stageByTyping("activeForeground", "#b2b2b2");
    await driver().executeScript(
      "document.activeElement && document.activeElement.blur();" +
        "document.querySelector('button[data-apply-all]').click();" +
        "var field = document.querySelector('[data-hex-for=\"errorForeground\"]');" +
        "field.value = '#c3c3c3';" +
        "field.dispatchEvent(new Event('input'));"
    );
    await waitForSaved("centerColorOfRainbow", "#a1a1a1");
    await waitForSaved("activeForeground", "#b2b2b2");
    await driver().sleep(settleMs);
    assert.strictEqual(await rowIsPending("errorForeground"), true, "the color staged during Apply all was discarded");
    assert.strictEqual(await shownHex("errorForeground"), "#c3c3c3");
    assert.strictEqual(savedColor("errorForeground"), undefined, "Apply all saved a color staged after it was clicked");
    assert.strictEqual(await rowIsPending("centerColorOfRainbow"), false);
    assert.strictEqual(await rowIsPending("activeForeground"), false);
    await resetRow("errorForeground");
  });

  it("U8 saves two Applies clicked back to back without either row showing its old value", async function () {
    await stageByTyping("warningForeground", "#d4d4d4");
    await stageByTyping("foregroundColorOfRepeatingDigits", "#e5e5e5");
    await driver().executeScript(
      "window.__shown = [];" +
        "window.addEventListener('message', function () {" +
        "  window.__shown.push([" +
        "    document.querySelector('[data-hex-for=\"warningForeground\"]').value," +
        "    document.querySelector('[data-hex-for=\"foregroundColorOfRepeatingDigits\"]').value]);" +
        "});" +
        "document.activeElement && document.activeElement.blur();" +
        "document.querySelector('button[data-apply=\"warningForeground\"]').click();" +
        "document.querySelector('button[data-apply=\"foregroundColorOfRepeatingDigits\"]').click();"
    );
    await waitForSaved("warningForeground", "#d4d4d4");
    await waitForSaved("foregroundColorOfRepeatingDigits", "#e5e5e5");
    await driver().sleep(settleMs);
    const shown = await driver().executeScript<string[][]>("return window.__shown;");
    assert.ok(shown.length > 0, "no state message arrived after the two Applies");
    shown.forEach(([warning, repeating], index) => {
      assert.deepStrictEqual(
        [warning, repeating],
        ["#d4d4d4", "#e5e5e5"],
        `state message ${index + 1} of ${shown.length} redrew a row at its old value`
      );
    });
    assert.strictEqual(await rowIsPending("warningForeground"), false);
    assert.strictEqual(await rowIsPending("foregroundColorOfRepeatingDigits"), false);
  });

  it("U9 sends a double-clicked Apply once, with the button disabled until the save is answered", async function () {
    await stageByTyping("centerColorOfRainbow", "#f6f6f6");
    const disabledAfterClicks = await driver().executeScript<boolean[]>(
      "var button = document.querySelector('button[data-apply=\"centerColorOfRainbow\"]');" +
        "var seen = [];" +
        "document.addEventListener('click', function (event) {" +
        "  if (event.target === button) { seen.push(button.disabled); }" +
        "});" +
        "document.activeElement && document.activeElement.blur();" +
        "button.click();" +
        "button.click();" +
        "return seen;"
    );
    assert.deepStrictEqual(
      disabledAfterClicks,
      [true],
      "each entry is a click that reached Apply, and whether Apply was disabled once it was handled"
    );
    await waitForSaved("centerColorOfRainbow", "#f6f6f6");
    await driver().wait(
      async () => await (await view.findWebElement(By.css('button[data-apply="centerColorOfRainbow"]'))).isEnabled(),
      settleMs,
      "Apply never came back after its save was answered"
    );
    assert.strictEqual(await rowIsPending("centerColorOfRainbow"), false);
  });

  it("U11 keeps a staged color through a trip to another pane", async function () {
    await stageByTyping("warningForeground", "#a7a7a7");
    await view.switchBack();
    const explorer = await new ActivityBar().getViewControl("Explorer");
    assert.ok(explorer, "the activity bar offers no Explorer view");
    await explorer.openView();
    await enterPanel();
    await driver().wait(
      async () => (await rowIsPending("warningForeground")) && (await shownHex("warningForeground")) === "#a7a7a7",
      settleMs,
      "the color staged before the trip to Explorer was gone when the panel came back"
    );
    await resetRow("warningForeground");
  });
});
