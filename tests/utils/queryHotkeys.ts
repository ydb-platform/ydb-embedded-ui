import type {Page} from '@playwright/test';

const HOTKEY_PROCESSING_DELAY = 1000;

function getModifierKey(page: Page) {
    const isMac = process.platform === 'darwin';
    const browserName = page.context().browser()?.browserType().name() ?? 'chromium';

    return {
        isMac,
        browserName,
        modifierKey: browserName === 'webkit' ? 'Meta' : 'Control',
    };
}

export async function executeQueryWithKeybinding(page: Page) {
    const {isMac, browserName, modifierKey} = getModifierKey(page);

    if (browserName !== 'webkit' || isMac) {
        await page.keyboard.down(modifierKey);
        await page.keyboard.press('Enter');
        await page.keyboard.up(modifierKey);
    } else {
        await page.keyboard.press('Meta+Enter');
    }

    await page.waitForTimeout(HOTKEY_PROCESSING_DELAY);
}

export async function executeSelectedQueryWithKeybinding(page: Page) {
    const {isMac, browserName, modifierKey} = getModifierKey(page);

    if (browserName !== 'webkit' || isMac) {
        await page.keyboard.down(modifierKey);
        await page.keyboard.down('Shift');
        await page.keyboard.press('Enter');
        await page.keyboard.up('Shift');
        await page.keyboard.up(modifierKey);
    } else {
        await page.keyboard.press('Meta+Shift+Enter');
    }

    await page.waitForTimeout(HOTKEY_PROCESSING_DELAY);
}
