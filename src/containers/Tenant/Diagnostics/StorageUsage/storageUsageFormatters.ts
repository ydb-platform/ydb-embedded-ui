import {EMPTY_DATA_PLACEHOLDER} from '../../../../utils/constants';
import {formatNumber, formatPercent} from '../../../../utils/dataFormatters/dataFormatters';
import {
    formatMetricBytes as formatMetricBytesShared,
    getConsistentMetricBytesSize as getConsistentMetricBytesSizeShared,
} from '../../../../utils/storageMetrics';

export const STORAGE_USAGE_INITIAL_ROWS_COUNT = 3;

const OVERHEAD_PRECISION = 1;
const MIN_SHARE_PERCENT_WITH_FRACTION = 1;
const PERCENT_MULTIPLIER = 100;
const MAX_PROGRESS_PERCENT = 100;

export const getConsistentMetricBytesSize = getConsistentMetricBytesSizeShared;
export const formatMetricBytes = formatMetricBytesShared;

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
