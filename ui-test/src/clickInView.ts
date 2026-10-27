import { WebElement } from "selenium-webdriver";
import { VSBrowser } from "vscode-extension-tester";

/**
 * Scroll an element to the middle of the panel, as a reader would, and click it.
 *
 * The footer is pinned to the bottom of the panel, so an element that is merely
 * inside the viewport can still lie behind it and lose the click to the footer.
 */
export async function clickInView(element: WebElement): Promise<void> {
  await VSBrowser.instance.driver.executeScript(`arguments[0].scrollIntoView({ block: "center" });`, element);
  await element.click();
}
