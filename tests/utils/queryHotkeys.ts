import type {Dialog, Page} from '@playwright/test';

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

type HotkeyDescriptor = {
    key: string;
    alt?: boolean;
    shift?: boolean;
};

type TabHotkeyAction =
    | 'newTab'
    | 'renameTab'
    | 'duplicateTab'
    | 'closeTab'
    | 'closeOtherTabs'
    | 'closeAllTabs'
    | 'saveQueryAs'
    | 'nextTab'
    | 'previousTab';

const TAB_HOTKEYS: Record<TabHotkeyAction, HotkeyDescriptor> = {
    newTab: {key: 'T', alt: true},
    renameTab: {key: 'R', alt: true},
    duplicateTab: {key: 'C', alt: true},
    closeTab: {key: 'Backspace'},
    closeOtherTabs: {key: 'Backspace', alt: true},
    closeAllTabs: {key: 'Backspace', shift: true},
    saveQueryAs: {key: 'S', shift: true},
    nextTab: {key: 'ArrowRight', alt: true},
    previousTab: {key: 'ArrowLeft', alt: true},
};

async function pressTabHotkeyCombo(page: Page, descriptor: HotkeyDescriptor) {
    const modifierKey = process.platform === 'darwin' ? 'Meta' : 'Control';
    const comboParts = [
        modifierKey,
        descriptor.alt ? 'Alt' : '',
        descriptor.shift ? 'Shift' : '',
        descriptor.key,
    ]
        .filter(Boolean)
        .join('+');

    await page.keyboard.press(comboParts);
    await page.waitForTimeout(300);
}

export async function pressTabHotkey(page: Page, action: TabHotkeyAction) {
    await pressTabHotkeyCombo(page, TAB_HOTKEYS[action]);
}

export async function waitForBeforeUnloadDialog(
    page: Page,
    trigger: () => Promise<unknown>,
): Promise<{dialog: Dialog; triggerPromise: Promise<unknown>}> {
    const dialogPromise = page.waitForEvent('dialog');
    const triggerPromise = trigger().catch((error) => error);
    const dialog = await dialogPromise;

    if (dialog.type() !== 'beforeunload') {
        throw new Error(`Expected beforeunload dialog, received ${dialog.type()}`);
    }

    return {dialog, triggerPromise};
}
