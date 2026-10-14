import * as assert from "assert";
import { Origin } from "selenium-webdriver";
import { ActivityBar, SideBarView, VSBrowser, WebviewView } from "vscode-extension-tester";

/** How long the webview iframe is given to appear in the sidebar. */
const frameTimeoutMs = 30000;

/** A sidebar dragged wide enough for every row to fit on one line. */
const wideWidth = 640;

/** A sidebar dragged to the 170 px VS Code allows at the least, where no row fits on one line. */
const narrowWidth = 170;

/** The rows whose label sits apart from their controls, one of each kind. */
const rows = ["centerColorOfRainbow", "editor.lineNumbers"];

/** Where a row's label and controls landed, relative to the panel body. */
interface Placement {
  labelTop: number;
  labelBottom: number;
  controlsTop: number;
  overflow: number;
  widest: string;
}

describe("settings panel rows follow the sidebar width", function () {
  this.timeout(240000);

  let sideBar: SideBarView;
  let view: InstanceType<typeof WebviewView>;
  let original: number;
  const driver = () => VSBrowser.instance.driver;

  /** Drag the sash on the sidebar's right edge until the sidebar is a given width. */
  async function dragSidebarTo(width: number) {
    await view.switchBack();
    const rect = await sideBar.getRect();
    const edge = rect.x + rect.width;
    let sash;
    for (const candidate of await driver().findElements({ css: ".monaco-sash.vertical" })) {
      const r = await candidate.getRect();
      if (Math.abs(r.x + r.width / 2 - edge) < 6 && (await candidate.isDisplayed())) {
        sash = candidate;
        break;
      }
    }
    assert.ok(sash, "no sash on the sidebar's right edge");
    await driver().actions().move({ origin: sash }).press().move({ origin: Origin.POINTER, x: Math.round(width - rect.width), y: 0, duration: 300 }).release().perform();
    await driver().wait(async () => Math.abs((await sideBar.getRect()).width - width) <= 2, 5000, `the sidebar never reached ${width}px`);
    await view.switchToFrame(frameTimeoutMs);
  }

  /** Drag the sidebar to a width and measure one row in the panel it now holds. */
  async function placeAt(width: number, key: string): Promise<Placement> {
    await dragSidebarTo(width);
    return await driver().wait(async () => await driver().executeScript<Placement>(
      `
      const row = document.querySelector('[data-row="' + arguments[0] + '"]');
      const label = row.querySelector(':scope > .label').getBoundingClientRect();
      const controls = row.querySelector(':scope > .controls').getBoundingClientRect();
      const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      const edge = document.documentElement.clientWidth;
      const widest = [...document.body.querySelectorAll('*')]
        .map((e) => ({ e, right: e.getBoundingClientRect().right }))
        .filter(({ right }) => right > edge)
        .sort((a, b) => b.right - a.right)
        .slice(0, 3)
        .map(({ e, right }) => e.tagName.toLowerCase() + '.' + [...e.classList].join('.') + ' ' + (e.textContent || '').trim().slice(0, 20) + ' @' + Math.round(right))
        .join(', ');
      return { labelTop: label.top, labelBottom: label.bottom, controlsTop: controls.top, overflow, widest };
      `,
      key
    ), 5000);
  }

  before(async function () {
    const control = await new ActivityBar().getViewControl("LineNumberDeco");
    assert.ok(control, "the extension contributes no LineNumberDeco view container");
    await control.openView();
    sideBar = new SideBarView();
    await driver().wait(async () => await sideBar.isDisplayed(), frameTimeoutMs, "the sidebar never showed the settings view");
    original = (await sideBar.getRect()).width;
    view = new WebviewView(sideBar);
    await view.switchToFrame(frameTimeoutMs);
  });

  after(async function () {
    await dragSidebarTo(original);
    await view?.switchBack();
  });

  for (const key of rows) {
    it(`Must put the controls of ${key} beside its label in a wide sidebar`, async function () {
      const placed = await placeAt(wideWidth, key);
      assert.ok(
        placed.controlsTop < placed.labelBottom,
        `the controls start at ${placed.controlsTop}, below the label ending at ${placed.labelBottom}`
      );
    });

    it(`Must move the controls of ${key} under its label in a narrow sidebar, without scrolling sideways`, async function () {
      const placed = await placeAt(narrowWidth, key);
      assert.ok(
        placed.controlsTop >= placed.labelBottom,
        `the controls start at ${placed.controlsTop}, beside the label ending at ${placed.labelBottom}`
      );
      assert.strictEqual(placed.overflow, 0, `the panel scrolls sideways by ${placed.overflow}px past ${placed.widest}`);
    });
  }
});
