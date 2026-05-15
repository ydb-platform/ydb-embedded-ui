import {copyResultToClipboard, copyTextDataToClipboard} from '../copyToClipboard';

describe('copyToClipboard', () => {
    const originalNavigator = (global as unknown as {navigator: Navigator}).navigator;
    const originalExecCommand = (document as unknown as {execCommand?: (cmd: string) => boolean})
        .execCommand;
    const originalClipboardItem = (global as unknown as {ClipboardItem?: unknown}).ClipboardItem;

    beforeAll(() => {
        // jsdom does not implement ClipboardItem; provide a minimal stub
        // so the modern clipboard.write() path can be exercised in tests.
        (global as unknown as {ClipboardItem: unknown}).ClipboardItem = class ClipboardItemStub {
            items: Record<string, Blob>;
            constructor(items: Record<string, Blob>) {
                this.items = items;
            }
        };
    });

    afterAll(() => {
        (global as unknown as {ClipboardItem?: unknown}).ClipboardItem = originalClipboardItem;
    });

    afterEach(() => {
        Object.defineProperty(global, 'navigator', {
            value: originalNavigator,
            configurable: true,
            writable: true,
        });
        (document as unknown as {execCommand?: (cmd: string) => boolean}).execCommand =
            originalExecCommand;
        jest.restoreAllMocks();
    });

    function setNavigator(value: unknown) {
        Object.defineProperty(global, 'navigator', {
            value,
            configurable: true,
            writable: true,
        });
    }

    function mockExecCommand(returnValue: boolean) {
        const spy = jest.fn().mockReturnValue(returnValue);
        (document as unknown as {execCommand: (cmd: string) => boolean}).execCommand =
            spy as unknown as (cmd: string) => boolean;
        return spy;
    }

    it('returns false for empty result data', async () => {
        await expect(copyResultToClipboard(undefined)).resolves.toBe(false);
        await expect(copyResultToClipboard([])).resolves.toBe(false);
    });

    it('returns false for empty text data', async () => {
        await expect(copyTextDataToClipboard(undefined)).resolves.toBe(false);
        await expect(copyTextDataToClipboard('')).resolves.toBe(false);
    });

    it('uses navigator.clipboard.write when available', async () => {
        const write = jest.fn().mockResolvedValue(undefined);
        setNavigator({clipboard: {write}});

        await expect(copyTextDataToClipboard('hello')).resolves.toBe(true);
        expect(write).toHaveBeenCalledTimes(1);
    });

    it('falls back to writeText when clipboard.write throws', async () => {
        const write = jest.fn().mockRejectedValue(new Error('nope'));
        const writeText = jest.fn().mockResolvedValue(undefined);
        setNavigator({clipboard: {write, writeText}});

        await expect(copyTextDataToClipboard('hello')).resolves.toBe(true);
        expect(writeText).toHaveBeenCalledWith('hello');
    });

    it('falls back to document.execCommand when navigator.clipboard is unavailable (non-secure context)', async () => {
        // Simulate non-secure context where navigator.clipboard is undefined.
        setNavigator({});
        const execCommand = mockExecCommand(true);

        await expect(copyTextDataToClipboard('hello')).resolves.toBe(true);
        expect(execCommand).toHaveBeenCalledWith('copy');
    });

    it('falls back to document.execCommand when both clipboard methods fail', async () => {
        const write = jest.fn().mockRejectedValue(new Error('nope'));
        const writeText = jest.fn().mockRejectedValue(new Error('nope'));
        setNavigator({clipboard: {write, writeText}});
        const execCommand = mockExecCommand(true);

        await expect(copyTextDataToClipboard('hello')).resolves.toBe(true);
        expect(execCommand).toHaveBeenCalledWith('copy');
    });

    it('returns false when all copy methods fail', async () => {
        setNavigator({});
        mockExecCommand(false);

        await expect(copyTextDataToClipboard('hello')).resolves.toBe(false);
    });

    it('removes the temporary textarea after execCommand fallback', async () => {
        setNavigator({});
        mockExecCommand(true);

        const before = document.querySelectorAll('textarea').length;
        await copyTextDataToClipboard('hello');
        const after = document.querySelectorAll('textarea').length;
        expect(after).toBe(before);
    });
});
