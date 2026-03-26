import type {BytesSizes} from '../../../../utils/bytesParsers';
import {getBytesSizeUnit, sizes} from '../../../../utils/bytesParsers';
import {EMPTY_DATA_PLACEHOLDER, UNBREAKABLE_GAP} from '../../../../utils/constants';
import {formatNumber, formatPercent} from '../../../../utils/dataFormatters/dataFormatters';

export const STORAGE_USAGE_INITIAL_ROWS_COUNT = 3;

const OVERHEAD_PRECISION = 1;
const MIN_SHARE_PERCENT_WITH_FRACTION = 1;
const PERCENT_MULTIPLIER = 100;
const MAX_PROGRESS_PERCENT = 100;

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
    // TB and PB: <10 → 2 decimal places, 10+ → 1 decimal place
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

export function formatOverhead(
    diskUsage: number | undefined,
    dataSize: string | number | undefined,
) {
    const parsedDataSize = Number(dataSize);

    if (!diskUsage || !Number.isFinite(parsedDataSize) || parsedDataSize <= 0) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    const overhead = Number((diskUsage / parsedDataSize).toFixed(OVERHEAD_PRECISION));

    return `${formatNumber(overhead)}x`;
}

export function getSharePercent(share: number) {
    const rawPercent = share * PERCENT_MULTIPLIER;

    if (!Number.isFinite(rawPercent) || rawPercent <= 0) {
        return 0;
    }

    return Math.min(rawPercent, MAX_PROGRESS_PERCENT);
}

export function formatShare(share: number) {
    const sharePercent = getSharePercent(share);
    const precision =
        sharePercent < MIN_SHARE_PERCENT_WITH_FRACTION && sharePercent > 0 ? OVERHEAD_PRECISION : 0;
    const normalizedShare = sharePercent / PERCENT_MULTIPLIER;

    return formatPercent(normalizedShare, precision);
}
