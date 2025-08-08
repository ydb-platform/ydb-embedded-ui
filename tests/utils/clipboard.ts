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

    // Fallback: Create a contenteditable element, focus it, and send keyboard shortcuts
    return page.evaluate(async () => {
        const el = document.createElement('div');
        el.contentEditable = 'true';
        document.body.appendChild(el);
        el.focus();

        try {
            // Send paste command
            document.execCommand('paste');
            const text = el.textContent || '';
            document.body.removeChild(el);
            return text;
        } catch {
            document.body.removeChild(el);
            return '';
        }
    });
};
