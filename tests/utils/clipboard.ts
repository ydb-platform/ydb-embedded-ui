import type {Page} from '@playwright/test';

export const getClipboardContent = async (page: Page): Promise<string> => {
    await page.context().grantPermissions(['clipboard-read']);

    return page.evaluate(async () => {
        try {
            const text = await navigator.clipboard.readText();
            return text;
        } catch (error) {
            console.error('Failed to read clipboard:', error);
            return '';
        }
    });
};
