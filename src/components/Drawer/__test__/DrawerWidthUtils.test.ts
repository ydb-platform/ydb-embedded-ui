import {
    MAX_DRAWER_WIDTH_PERCENTS,
    MIN_DRAWER_WIDTH_PERCENTS,
    MIN_DRAWER_WIDTH_PX,
    normalizeDrawerWidthFromResize,
    normalizeDrawerWidthFromSavedString,
} from '../DrawerWidthUtils';

describe('DrawerWidthUtils', () => {
    describe('normalizeDrawerWidthFromSavedString', () => {
        it('falls back when savedWidthString is missing/invalid', () => {
            expect(
                normalizeDrawerWidthFromSavedString({
                    savedWidthString: undefined,
                    defaultWidth: 123,
                    isPercentageWidth: false,
                    containerWidth: 0,
                    defaultPercents: 60,
                    defaultPx: 600,
                }),
            ).toBe(123);

            expect(
                normalizeDrawerWidthFromSavedString({
                    savedWidthString: 'abc',
                    defaultWidth: undefined,
                    isPercentageWidth: true,
                    containerWidth: 0,
                    defaultPercents: 60,
                    defaultPx: 600,
                }),
            ).toBe(60);
        });

        it('clamps percentage width to [1..100]', () => {
            expect(
                normalizeDrawerWidthFromSavedString({
                    savedWidthString: '-10',
                    defaultWidth: undefined,
                    isPercentageWidth: true,
                    containerWidth: 0,
                    defaultPercents: 60,
                    defaultPx: 600,
                }),
            ).toBe(MIN_DRAWER_WIDTH_PERCENTS);

            expect(
                normalizeDrawerWidthFromSavedString({
                    savedWidthString: '1000',
                    defaultWidth: undefined,
                    isPercentageWidth: true,
                    containerWidth: 0,
                    defaultPercents: 60,
                    defaultPx: 600,
                }),
            ).toBe(MAX_DRAWER_WIDTH_PERCENTS);
        });

        it('enforces px width >= 1 and caps to containerWidth when provided', () => {
            expect(
                normalizeDrawerWidthFromSavedString({
                    savedWidthString: '0',
                    defaultWidth: 200,
                    isPercentageWidth: false,
                    containerWidth: 0,
                    defaultPercents: 60,
                    defaultPx: 600,
                }),
            ).toBe(200);

            expect(
                normalizeDrawerWidthFromSavedString({
                    savedWidthString: '500',
                    defaultWidth: undefined,
                    isPercentageWidth: false,
                    containerWidth: 300,
                    defaultPercents: 60,
                    defaultPx: 600,
                }),
            ).toBe(300);
        });
    });

    describe('normalizeDrawerWidthFromResize', () => {
        it('returns percent width when isPercentageWidth and containerWidth > 0', () => {
            const normalized = normalizeDrawerWidthFromResize({
                resizedWidthPx: 240,
                isPercentageWidth: true,
                containerWidth: 400,
            });

            expect(normalized.drawerWidth).toBe(60);
            expect(normalized.savedWidthString).toBe('60');
        });

        it('clamps percent width to [1..100]', () => {
            const normalized = normalizeDrawerWidthFromResize({
                resizedWidthPx: 10_000,
                isPercentageWidth: true,
                containerWidth: 100,
            });

            expect(normalized.drawerWidth).toBe(MAX_DRAWER_WIDTH_PERCENTS);
            expect(normalized.savedWidthString).toBe(String(MAX_DRAWER_WIDTH_PERCENTS));
        });

        it('caps px width to containerWidth (when provided) and enforces >= 1px', () => {
            const normalized = normalizeDrawerWidthFromResize({
                resizedWidthPx: 0,
                isPercentageWidth: false,
                containerWidth: 0,
            });
            expect(normalized.drawerWidth).toBe(MIN_DRAWER_WIDTH_PX);
            expect(normalized.savedWidthString).toBe(String(MIN_DRAWER_WIDTH_PX));

            const capped = normalizeDrawerWidthFromResize({
                resizedWidthPx: 500,
                isPercentageWidth: false,
                containerWidth: 300,
            });
            expect(capped.drawerWidth).toBe(300);
            expect(capped.savedWidthString).toBe('300');
        });
    });
});
