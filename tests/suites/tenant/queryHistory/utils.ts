import type {Page} from '@playwright/test';

// eslint-disable-next-line no-implicit-globals
export default async function executeQueryWithKeybinding(page: Page, browserName: string) {
    const isMac = process.platform === 'darwin';
    const modifierKey = isMac && browserName === 'webkit' ? 'Meta' : 'Control';

    console.log(`Using ${modifierKey} key for ${browserName}`);

    // Press the modifier key
    await page.keyboard.down(modifierKey);

    // Press Enter
    await page.keyboard.press('Enter');

    // Release the modifier key
    await page.keyboard.up(modifierKey);

    // Log the active element for debugging
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    console.log(`Active element after keybinding: ${activeElement}`);

    // Add a small delay to ensure the event is processed
    await page.waitForTimeout(1000);
}
