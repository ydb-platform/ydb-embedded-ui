import {isNumeric} from '../../utils/utils';

export const MIN_DRAWER_WIDTH_PERCENTS = 1;
export const MAX_DRAWER_WIDTH_PERCENTS = 100;
export const MIN_DRAWER_WIDTH_PX = 1;

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function getFallbackWidth(args: {
    defaultWidth?: number;
    isPercentageWidth?: boolean;
    defaultPercents: number;
    defaultPx: number;
}) {
    const {defaultWidth, isPercentageWidth, defaultPercents, defaultPx} = args;
    if (defaultWidth !== undefined) {
        return defaultWidth;
    }
    return isPercentageWidth ? defaultPercents : defaultPx;
}

export function normalizeDrawerWidthFromSavedString(args: {
    savedWidthString: string | undefined;
    defaultWidth?: number;
    isPercentageWidth?: boolean;
    containerWidth: number;
    defaultPercents: number;
    defaultPx: number;
}) {
    const {
        savedWidthString,
        defaultWidth,
        isPercentageWidth,
        containerWidth,
        defaultPercents,
        defaultPx,
    } = args;

    const fallback = getFallbackWidth({
        defaultWidth,
        isPercentageWidth,
        defaultPercents,
        defaultPx,
    });

    if (!isNumeric(savedWidthString)) {
        return fallback;
    }

    const raw = Number(savedWidthString);
    if (!Number.isFinite(raw)) {
        return fallback;
    }

    if (isPercentageWidth) {
        return clamp(raw, MIN_DRAWER_WIDTH_PERCENTS, MAX_DRAWER_WIDTH_PERCENTS);
    }

    if (raw < MIN_DRAWER_WIDTH_PX) {
        return fallback;
    }

    if (containerWidth > 0) {
        return Math.min(raw, containerWidth);
    }

    return raw;
}

export function normalizeDrawerWidthFromResize(args: {
    resizedWidthPx: number;
    isPercentageWidth?: boolean;
    containerWidth: number;
}) {
    const {resizedWidthPx, isPercentageWidth, containerWidth} = args;

    if (isPercentageWidth && containerWidth > 0) {
        const percentageWidthRaw = Math.round((resizedWidthPx / containerWidth) * 100);
        const percentageWidth = clamp(
            percentageWidthRaw,
            MIN_DRAWER_WIDTH_PERCENTS,
            MAX_DRAWER_WIDTH_PERCENTS,
        );

        return {
            drawerWidth: percentageWidth,
            savedWidthString: percentageWidth.toString(),
        } as const;
    }

    const cappedWidth =
        containerWidth > 0 ? Math.min(resizedWidthPx, containerWidth) : resizedWidthPx;
    const safeWidth = Math.max(MIN_DRAWER_WIDTH_PX, cappedWidth);

    return {drawerWidth: safeWidth, savedWidthString: safeWidth.toString()} as const;
}
