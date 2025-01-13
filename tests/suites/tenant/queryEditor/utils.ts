import type {Page} from '@playwright/test';

export const executeSelectedQueryWithKeybinding = async (page: Page) => {
    const isMac = process.platform === 'darwin';
    const browserName = page.context().browser()?.browserType().name() ?? 'chromium';
    const modifierKey = browserName === 'webkit' ? 'Meta' : 'Control';

    if (browserName !== 'webkit' || isMac) {
        await page.keyboard.down(modifierKey);
        await page.keyboard.down('Shift');
        await page.keyboard.press('Enter');
        await page.keyboard.up('Shift');
        await page.keyboard.up(modifierKey);
    } else {
        await page.keyboard.press('Meta+Shift+Enter');
    }

    // Add a small delay to ensure the event is processed
    await page.waitForTimeout(1000);
};
