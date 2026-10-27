import * as assert from "assert";
import { ActivityBar, SideBarView, VSBrowser, WebviewView } from "vscode-extension-tester";

/** How long the webview iframe is given to appear in the sidebar. */
const frameTimeoutMs = 30000;

/** The toggle whose switch is flipped to stage a change. */
const staged = "enableRainbow";

/** A toggle left alone, so its Apply shows what a row with nothing staged looks like. */
const untouched = "enableRepeatingDigits";

/** A row whose Apply sits inside its controls, which are dimmed while they show an inherited value. */
const stagedSelect = "editor.lineNumbers";

describe("settings panel shows what can be applied", function () {
  this.timeout(240000);

  let view: InstanceType<typeof WebviewView>;
  const driver = () => VSBrowser.instance.driver;

  /** The background the page resolved for one button. */
  async function backgroundOf(selector: string): Promise<string> {
    return await driver().executeScript<string>(
      `return getComputedStyle(document.querySelector(arguments[0])).backgroundColor;`,
      selector
    );
  }

  /** How opaque one button is drawn, counting every ancestor that dims it. */
  async function drawnOpacityOf(selector: string): Promise<number> {
    return await driver().executeScript<number>(
      `
      let opacity = 1;
      for (let node = document.querySelector(arguments[0]); node; node = node.parentElement) {
        opacity *= Number(getComputedStyle(node).opacity);
      }
      return opacity;
      `,
      selector
    );
  }

  /** Where Reset all sits against the panel's viewport, after scrolling the panel to a fraction of its height. */
  async function resetAllAfterScrolling(fraction: number) {
    return await driver().executeScript<{ top: number; bottom: number; viewport: number; scrollable: number }>(
      `
      const page = document.scrollingElement;
      page.scrollTop = (page.scrollHeight - page.clientHeight) * arguments[0];
      const rect = document.querySelector("button[data-reset-all]").getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, viewport: window.innerHeight, scrollable: page.scrollHeight - page.clientHeight };
      `,
      fraction
    );
  }

  before(async function () {
    const control = await new ActivityBar().getViewControl("LineNumberDeco");
    assert.ok(control, "the extension contributes no LineNumberDeco view container");
    await control.openView();
    const sideBar = new SideBarView();
    await driver().wait(async () => await sideBar.isDisplayed(), frameTimeoutMs, "the sidebar never showed the settings view");
    view = new WebviewView(sideBar);
    await view.switchToFrame(frameTimeoutMs);
  });

  after(async function () {
    await driver().executeScript(`document.querySelector("button[data-reset-all]").click();`);
    await view?.switchBack();
  });

  it("Must draw the Apply of a row with a staged change like Apply all, and the others not", async function () {
    await driver().executeScript(`document.querySelector('[data-toggle="' + arguments[0] + '"]').click();`, staged);
    await driver().wait(
      async () => await driver().executeScript<boolean>(`return document.querySelector('[data-row="' + arguments[0] + '"]').classList.contains("pending");`, staged),
      5000,
      `${staged} never showed as staged`
    );
    const primary = await backgroundOf("button[data-apply-all]");
    assert.strictEqual(await backgroundOf(`button[data-apply-toggle="${staged}"]`), primary);
    assert.notStrictEqual(await backgroundOf(`button[data-apply-toggle="${untouched}"]`), primary);
  });

  it("Must draw the Apply of a staged row as opaque as Apply all, even where the saved value is inherited", async function () {
    await driver().executeScript(
      `document.querySelector('[data-select-for="' + arguments[0] + '"]:not([data-current="true"])').click();`,
      stagedSelect
    );
    await driver().wait(
      async () => await driver().executeScript<boolean>(`return document.querySelector('[data-row="' + arguments[0] + '"]').classList.contains("pending");`, stagedSelect),
      5000,
      `${stagedSelect} never showed as staged`
    );
    assert.ok(
      await driver().executeScript<boolean>(`return document.querySelector('[data-row="' + arguments[0] + '"]').classList.contains("inherited");`, stagedSelect),
      `${stagedSelect} is saved in the scope shown, so this proves nothing`
    );
    assert.strictEqual(await drawnOpacityOf(`button[data-apply="${stagedSelect}"]`), await drawnOpacityOf("button[data-apply-all]"));
  });

  it("Must scroll a focused control out from behind the pinned footer", async function () {
    const placed = await driver().executeScript<{ bottom: number; footerTop: number; hiddenBefore: boolean }>(`
      const footer = document.querySelector(".footer");
      const page = document.scrollingElement;
      page.scrollTop = 0;
      const reset = [...document.querySelectorAll("button[data-reset]")]
        .find((button) => button.getBoundingClientRect().bottom > window.innerHeight);
      page.scrollTop += reset.getBoundingClientRect().bottom - window.innerHeight + 4;
      const hiddenBefore = reset.getBoundingClientRect().bottom > footer.getBoundingClientRect().top;
      reset.focus();
      return { bottom: reset.getBoundingClientRect().bottom, footerTop: footer.getBoundingClientRect().top, hiddenBefore };
    `);
    assert.ok(placed.hiddenBefore, "the control never sat behind the footer, so this proves nothing");
    assert.ok(placed.bottom <= placed.footerTop, `the focused control ends at ${placed.bottom}, behind the footer from ${placed.footerTop}`);
  });

  for (const fraction of [0, 0.5]) {
    it(`Must keep Reset all in view with the panel scrolled to ${fraction * 100}% of its height`, async function () {
      const placed = await resetAllAfterScrolling(fraction);
      assert.ok(placed.scrollable > 0, "the panel fits without scrolling, so this proves nothing");
      assert.ok(
        placed.top >= 0 && placed.bottom <= placed.viewport,
        `Reset all spans ${placed.top} to ${placed.bottom} in a viewport ${placed.viewport} high`
      );
    });
  }
});
