import type {Page} from '@playwright/test';

export const getClipboardContent = async (page: Page): Promise<string> => {
    // First try the modern Clipboard API
    const clipboardText = await page.evaluate(async () => {
        try {
            const text = await navigator.clipboard.readText();
            return text;
        } catch {
            return null;
        }
    });

    if (clipboardText !== null) {
        return clipboardText;
    }

    // A plain-text field preserves line breaks that contenteditable textContent omits.
    return page.evaluate(async () => {
        const input = document.createElement('textarea');
        document.body.appendChild(input);
        input.focus();

        try {
            document.execCommand('paste');
            return input.value;
        } catch {
            return '';
        } finally {
            input.remove();
        }
    });
};
