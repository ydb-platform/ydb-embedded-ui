import type {Page} from '@playwright/test';

export default async function executeQueryWithKeybinding(page: Page, browserName: string) {
    const isMac = process.platform === 'darwin';
    const modifierKey = browserName === 'webkit' ? 'Meta' : 'Control';

    if (browserName !== 'webkit' || isMac) {
        await page.keyboard.down(modifierKey);
        await page.keyboard.press('Enter');
        await page.keyboard.up(modifierKey);
    } else {
        await page.keyboard.press('Meta+Enter');
    }

    // Add a small delay to ensure the event is processed
    await page.waitForTimeout(1000);
}
