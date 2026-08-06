import type {BytesSizes} from './bytesParsers';
import {bytesSizes, getBytesSizeUnit, sizes} from './bytesParsers';
import {EMPTY_DATA_PLACEHOLDER, UNBREAKABLE_GAP} from './constants';
import {
    formatNumber,
    formatPercent,
    formatStorageValuesToGb,
} from './dataFormatters/dataFormatters';
import {parseOptionalNonNegativeNumber} from './utils';

export interface FormatMetricBytesOptions {
    allowNegative?: boolean;
    bytesDecimalPlaces?: 0 | 1;
    coarseApproximateRounding?: boolean;
    gbDecimalPlacesBelowOne?: 1 | 2;
}

const NEXT_SIZE_ROLLOVER_VALUE = 1000;
const MIXED_UNIT_RATIO_THRESHOLD = 100;

function getNextMetricBytesSize(size: BytesSizes) {
    const currentSizeIndex = bytesSizes.indexOf(size);

    return bytesSizes[currentSizeIndex + 1];
}

function getCoarseApproximateMetricBytesDecimalPlaces(size: BytesSizes, convertedValue: number) {
    if ((size === 'tb' || size === 'pb') && convertedValue > 1 && convertedValue < 10) {
        return 1;
    }

    return 0;
}

export function getConvertedMetricBytesDecimalPlaces(
    size: BytesSizes,
    convertedValue: number,
    {
        bytesDecimalPlaces = 1,
        coarseApproximateRounding = false,
        gbDecimalPlacesBelowOne = 2,
    }: FormatMetricBytesOptions = {},
) {
    if (coarseApproximateRounding) {
        return getCoarseApproximateMetricBytesDecimalPlaces(size, convertedValue);
    }

    if (size === 'b') {
        return convertedValue % 1 === 0 ? 0 : bytesDecimalPlaces;
    }

    if (size === 'kb') {
        return convertedValue % 1 === 0 ? 0 : 1;
    }

    if (size === 'mb' && convertedValue < 10) {
        return convertedValue % 1 === 0 ? 0 : 1;
    } else if (size === 'mb') {
        return 0;
    }

    if (size === 'gb') {
        if (convertedValue < 1) {
            return convertedValue % 1 === 0 ? 0 : gbDecimalPlacesBelowOne;
        }
        return convertedValue % 1 === 0 ? 0 : 1;
    }
    if (convertedValue < 10) {
        return 2;
    }
    return 1;
}

function getFormattedMetricBytesValue(
    numericValue: number,
    size: BytesSizes,
    options: FormatMetricBytesOptions,
) {
    const convertedValue = numericValue / sizes[size].value;
    const decimalPlaces = getConvertedMetricBytesDecimalPlaces(size, convertedValue, options);

    return Number(convertedValue.toFixed(decimalPlaces));
}

export function getMetricBytesDisplaySize(
    numericValue: number,
    options: FormatMetricBytesOptions = {},
) {
    let resolvedSize = getBytesSizeUnit(numericValue);

    while (true) {
        const nextSize = getNextMetricBytesSize(resolvedSize);
        const rounded = getFormattedMetricBytesValue(numericValue, resolvedSize, options);

        if (!nextSize || Math.abs(rounded) < NEXT_SIZE_ROLLOVER_VALUE) {
            return resolvedSize;
        }

        resolvedSize = nextSize;
    }
}

export function getConsistentMetricBytesSize(
    values: Array<string | number | undefined>,
    options: FormatMetricBytesOptions = {},
) {
    const maxValue = values.reduce<number>((currentMaxValue, value) => {
        const numericValue = Number(value);

        if (!Number.isFinite(numericValue) || numericValue < 0) {
            return currentMaxValue;
        }

        return Math.max(currentMaxValue, numericValue);
    }, 0);

    return getMetricBytesDisplaySize(maxValue, options);
}

export function shouldUseMixedMetricBytesUnits(
    values: Array<string | number | undefined>,
    ratioThreshold = MIXED_UNIT_RATIO_THRESHOLD,
) {
    const positiveValues = values
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0);

    if (positiveValues.length < 2) {
        return false;
    }

    const minValue = Math.min(...positiveValues);
    const maxValue = Math.max(...positiveValues);

    return maxValue / minValue >= ratioThreshold;
}

export function getMetricBytesCommonSize(
    values: Array<string | number | undefined>,
    options: FormatMetricBytesOptions = {},
) {
    return shouldUseMixedMetricBytesUnits(values)
        ? undefined
        : getConsistentMetricBytesSize(values, options);
}

export function formatMetricBytes(
    value?: string | number,
    size?: BytesSizes,
    options: FormatMetricBytesOptions = {},
) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || (options.allowNegative === false && numericValue < 0)) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    const resolvedSize = size ?? getMetricBytesDisplaySize(numericValue, options);
    const rounded = getFormattedMetricBytesValue(numericValue, resolvedSize, options);

    const formatted = formatNumber(rounded);

    return formatted
        ? `${formatted}${UNBREAKABLE_GAP}${sizes[resolvedSize].label}`
        : EMPTY_DATA_PLACEHOLDER;
}

export function formatMetricPercent(value?: unknown) {
    const numericValue = parseOptionalNonNegativeNumber(value);

    if (numericValue === undefined) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    const precision = Number.isInteger(numericValue) ? 0 : 1;

    return formatPercent(numericValue / 100, precision) || EMPTY_DATA_PLACEHOLDER;
}

export function formatStorageMetricPair(value?: string | number, capacity?: string | number) {
    const parsedValue = parseOptionalNonNegativeNumber(value);
    const parsedCapacity = parseOptionalNonNegativeNumber(capacity);

    if (parsedValue === undefined || parsedCapacity === undefined) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    return formatStorageValuesToGb(parsedValue, parsedCapacity).join(' / ');
}

export function formatNormalizedMetricPercent(value?: number) {
    const parsedValue = parseOptionalNonNegativeNumber(value);

    if (parsedValue === undefined) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    return formatPercent(parsedValue, 2, {fixed: true}) || EMPTY_DATA_PLACEHOLDER;
}

export function formatMetricCount(value?: unknown) {
    const parsedValue = parseOptionalNonNegativeNumber(value);

    if (parsedValue === undefined) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    return formatNumber(parsedValue) || EMPTY_DATA_PLACEHOLDER;
}

export function formatMetricCountPair(value?: unknown, capacity?: unknown) {
    const formattedValue = formatMetricCount(value);
    const formattedCapacity = formatMetricCount(capacity);

    if (formattedValue === EMPTY_DATA_PLACEHOLDER || formattedCapacity === EMPTY_DATA_PLACEHOLDER) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    return `${formattedValue} / ${formattedCapacity}`;
}
