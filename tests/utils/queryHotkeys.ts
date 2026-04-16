import type {Dialog, Page} from '@playwright/test';

const HOTKEY_PROCESSING_DELAY = 1000;

function getModifierKey(page: Page) {
    const isMac = process.platform === 'darwin';
    const browserName = page.context().browser()?.browserType().name() ?? 'chromium';

    return {
        isMac,
        browserName,
        modifierKey: isMac ? 'Meta' : 'Control',
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
    newTab: {key: 'KeyT', alt: true},
    renameTab: {key: 'KeyR', alt: true},
    duplicateTab: {key: 'KeyC', alt: true},
    closeTab: {key: 'Backspace'},
    closeOtherTabs: {key: 'Backspace', alt: true},
    closeAllTabs: {key: 'Backspace', shift: true},
    saveQueryAs: {key: 'KeyS', shift: true},
    nextTab: {key: 'ArrowRight', alt: true},
    previousTab: {key: 'ArrowLeft', alt: true},
};

const KEY_VALUES_BY_CODE: Record<string, string> = {
    KeyT: 'T',
    KeyR: 'R',
    KeyC: 'C',
    KeyS: 'S',
    ArrowRight: 'ArrowRight',
    ArrowLeft: 'ArrowLeft',
    Backspace: 'Backspace',
};

async function pressTabHotkeyCombo(page: Page, descriptor: HotkeyDescriptor) {
    const modifierKey = await page.evaluate(() => {
        const nav = navigator as Navigator & {userAgentData?: {platform?: string}};
        const platform = nav.userAgentData?.platform || navigator.platform || '';
        return platform.toUpperCase().includes('MAC') ? 'Meta' : 'Control';
    });

    if (descriptor.key === 'KeyR' && descriptor.alt) {
        await page.evaluate(
            ({modifierKey}) => {
                const keyCode = 82;
                const eventInit = {
                    key: 'r',
                    code: 'KeyR',
                    keyCode,
                    which: keyCode,
                    ctrlKey: modifierKey === 'Control',
                    metaKey: modifierKey === 'Meta',
                    altKey: true,
                    shiftKey: false,
                    bubbles: true,
                    cancelable: true,
                    composed: true,
                };

                for (const target of [document.body, document, window]) {
                    if (!target) {
                        continue;
                    }

                    target.dispatchEvent(new KeyboardEvent('keydown', eventInit));
                    target.dispatchEvent(new KeyboardEvent('keyup', eventInit));
                }
            },
            {modifierKey},
        );
        await page.waitForTimeout(300);
        return;
    }

    const comboParts = [
        modifierKey,
        descriptor.alt ? 'Alt' : '',
        descriptor.shift ? 'Shift' : '',
        KEY_VALUES_BY_CODE[descriptor.key] || descriptor.key,
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
