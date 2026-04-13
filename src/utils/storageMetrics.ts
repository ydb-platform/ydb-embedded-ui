import type {BytesSizes} from './bytesParsers';
import {getBytesSizeUnit, sizes} from './bytesParsers';
import {EMPTY_DATA_PLACEHOLDER, UNBREAKABLE_GAP} from './constants';
import {formatNumber, formatPercent} from './dataFormatters/dataFormatters';

function getMetricBytesDecimalPlaces(size: BytesSizes, convertedValue: number) {
    if (size === 'b' || size === 'kb' || size === 'mb') {
        return convertedValue % 1 === 0 ? 0 : 1;
    }
    if (size === 'gb') {
        if (convertedValue < 1) {
            return 2;
        }
        return convertedValue % 1 === 0 ? 0 : 1;
    }
    if (convertedValue < 10) {
        return 2;
    }
    return 1;
}

export function getConsistentMetricBytesSize(values: Array<string | number | undefined>) {
    const maxValue = values.reduce<number>((currentMaxValue, value) => {
        const numericValue = Number(value);

        if (!Number.isFinite(numericValue) || numericValue < 0) {
            return currentMaxValue;
        }

        return Math.max(currentMaxValue, numericValue);
    }, 0);

    return getBytesSizeUnit(maxValue);
}

export function formatMetricBytes(value?: string | number, size?: BytesSizes) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    const resolvedSize = size ?? getBytesSizeUnit(numericValue);
    const convertedValue = numericValue / sizes[resolvedSize].value;
    const decimalPlaces = getMetricBytesDecimalPlaces(resolvedSize, convertedValue);
    const rounded = Number(convertedValue.toFixed(decimalPlaces));
    const formatted = formatNumber(rounded);

    return formatted
        ? `${formatted}${UNBREAKABLE_GAP}${sizes[resolvedSize].label}`
        : EMPTY_DATA_PLACEHOLDER;
}

export function formatMetricPercent(value?: number) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue < 0) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    const precision = Number.isInteger(numericValue) ? 0 : 1;

    return formatPercent(numericValue / 100, precision);
}
