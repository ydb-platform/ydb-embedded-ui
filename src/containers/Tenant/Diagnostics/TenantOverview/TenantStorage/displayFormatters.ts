import type {BytesSizes} from '../../../../../utils/bytesParsers';
import {sizes} from '../../../../../utils/bytesParsers';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
import {formatNumber, formatPercent} from '../../../../../utils/dataFormatters/dataFormatters';
import type {FormatMetricBytesOptions} from '../../../../../utils/storageMetrics';
import {
    formatMetricBytes,
    getConsistentMetricBytesSize,
    getMetricBytesDisplaySize,
} from '../../../../../utils/storageMetrics';
import {parseOptionalNonNegativeNumber} from '../../../../../utils/utils';

import i18n from './i18n';

type TenantStorageSummaryMetricUnit = 'pb' | 'tb' | 'gb' | 'mb';

const MIXED_UNIT_RATIO_THRESHOLD = 100;
const TABLE_OVERHEAD_LIMIT = 500;
const BYTE_UNITS: BytesSizes[] = ['b', 'kb', 'mb', 'gb', 'tb', 'pb'];
const TENANT_STORAGE_FORMAT_OPTIONS = {
    allowNegative: false,
    bytesDecimalPlaces: 0,
    gbDecimalPlacesBelowOne: 1,
} as const;

export function formatSummaryPercent(value: number) {
    const precision = value > 0 && value < 1 ? 1 : 0;
    const formattedValue = formatPercent(value / 100, precision);

    return value > 0 && formattedValue ? i18n('context_used-percent', {value: formattedValue}) : '';
}

function formatByteMetric(
    value?: string | number,
    size?: BytesSizes,
    options?: FormatMetricBytesOptions,
) {
    return formatMetricBytes(value, size, {...TENANT_STORAGE_FORMAT_OPTIONS, ...options});
}

function normalizeTenantStorageSummaryMetricUnit(unit: BytesSizes): TenantStorageSummaryMetricUnit {
    return unit === 'b' || unit === 'kb' ? 'mb' : unit;
}

export function getTenantStorageSummaryMetricUnit(
    values: Array<string | number | undefined>,
): TenantStorageSummaryMetricUnit {
    return normalizeTenantStorageSummaryMetricUnit(
        getConsistentMetricBytesSize(values, TENANT_STORAGE_FORMAT_OPTIONS),
    );
}

export function formatTenantStorageSummaryMetric(
    value?: string | number,
    size?: TenantStorageSummaryMetricUnit,
) {
    return formatByteMetric(value, size);
}

export function formatTenantStorageApproximateMetric(
    value?: string | number,
    size?: TenantStorageSummaryMetricUnit,
) {
    const numericValue = parseOptionalNonNegativeNumber(value);

    if (numericValue === undefined) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    const shouldUseAdaptiveUnit = size !== undefined && numericValue < sizes[size].value;
    const formattedValue = shouldUseAdaptiveUnit
        ? formatByteMetric(numericValue, undefined, {coarseApproximateRounding: true})
        : formatByteMetric(numericValue, size, {coarseApproximateRounding: true});

    return formattedValue === EMPTY_DATA_PLACEHOLDER ? formattedValue : `~${formattedValue}`;
}

export function formatTenantStorageAdaptiveMetric(value?: string | number) {
    return formatByteMetric(value);
}

function getLowerByteUnit(size: BytesSizes) {
    const index = BYTE_UNITS.indexOf(size);

    return BYTE_UNITS[Math.max(index - 1, 0)] ?? 'b';
}

export function getTenantStorageSegmentValueFormatters(values: Array<string | number | undefined>) {
    const numericValues = values
        .map((value) => parseOptionalNonNegativeNumber(value))
        .filter((value): value is number => value !== undefined && value > 0);
    const minValue = Math.min(...numericValues);
    const maxValue = Math.max(...numericValues);
    const shouldUseMixedUnits =
        numericValues.length === 0 || maxValue / minValue >= MIXED_UNIT_RATIO_THRESHOLD;
    const commonSize = shouldUseMixedUnits
        ? undefined
        : getMetricBytesDisplaySize(maxValue, TENANT_STORAGE_FORMAT_OPTIONS);
    const getLegendSize = (value?: string | number) => {
        const numericValue = parseOptionalNonNegativeNumber(value);

        if (numericValue === undefined) {
            return undefined;
        }

        return commonSize ?? getMetricBytesDisplaySize(numericValue, TENANT_STORAGE_FORMAT_OPTIONS);
    };

    return {
        formatLegendValue: (value?: string | number) => formatByteMetric(value, commonSize),
        formatTooltipValue: (value?: string | number) => {
            const legendSize = getLegendSize(value);

            if (legendSize === undefined) {
                return EMPTY_DATA_PLACEHOLDER;
            }

            return formatByteMetric(value, getLowerByteUnit(legendSize));
        },
    };
}

export function getTenantStorageLegendValueFormatter(values: Array<string | number | undefined>) {
    return getTenantStorageSegmentValueFormatters(values).formatLegendValue;
}

export function formatTenantStorageTableMetric(value?: string | number | null) {
    return formatByteMetric(value ?? undefined);
}

export function formatOverheadValue(value?: number) {
    if (value === undefined || !Number.isFinite(value) || value <= 0) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    const precision = value >= 10 || Number.isInteger(value) ? 0 : 1;
    const normalizedValue = Number(value.toFixed(precision));

    return `${formatNumber(normalizedValue)}x`;
}

export function formatTenantStorageTableOverhead(value?: number) {
    if (value !== undefined && Number.isFinite(value) && value > TABLE_OVERHEAD_LIMIT) {
        return `>${TABLE_OVERHEAD_LIMIT}x`;
    }

    return formatOverheadValue(value);
}
