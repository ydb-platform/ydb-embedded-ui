import type {BytesSizes} from '../../../../../utils/bytesParsers';
import {getBytesSizeUnit, sizes} from '../../../../../utils/bytesParsers';
import {EMPTY_DATA_PLACEHOLDER, UNBREAKABLE_GAP} from '../../../../../utils/constants';
import {formatNumber, formatPercent} from '../../../../../utils/dataFormatters/dataFormatters';
import i18n from '../i18n';

type TenantStorageSummaryMetricUnit = 'tb' | 'gb' | 'mb';

const MIXED_UNIT_RATIO_THRESHOLD = 100;
const TABLE_OVERHEAD_LIMIT = 500;

export function formatSummaryPercent(value: number) {
    const formattedValue = formatPercent(value / 100, 0);

    return value > 0 && formattedValue
        ? i18n('storage.new.used-percent', {value: formattedValue})
        : '';
}

function getNumericByteValue(value?: string | number) {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : undefined;
}

function getMetricBytesDecimalPlaces(size: BytesSizes, convertedValue: number) {
    if (size === 'b') {
        return 0;
    }

    if (size === 'kb' || size === 'mb' || size === 'gb') {
        return Number.isInteger(convertedValue) ? 0 : 1;
    }

    if (convertedValue >= 10) {
        return Number.isInteger(convertedValue) ? 0 : 1;
    }

    return Number.isInteger(convertedValue) ? 0 : 2;
}

function formatByteMetric(value?: string | number, size?: BytesSizes) {
    const numericValue = getNumericByteValue(value);

    if (numericValue === undefined) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    const resolvedSize = size ?? getBytesSizeUnit(numericValue);
    const convertedValue = numericValue / sizes[resolvedSize].value;
    const decimalPlaces = getMetricBytesDecimalPlaces(resolvedSize, convertedValue);
    const roundedValue = Number(convertedValue.toFixed(decimalPlaces));
    const formattedValue = formatNumber(roundedValue);

    return formattedValue
        ? `${formattedValue}${UNBREAKABLE_GAP}${sizes[resolvedSize].label}`
        : EMPTY_DATA_PLACEHOLDER;
}

export function getTenantStorageSummaryMetricUnit(
    values: Array<string | number | undefined>,
): TenantStorageSummaryMetricUnit {
    const numericValues = values
        .map((value) => getNumericByteValue(value))
        .filter((value): value is number => value !== undefined);

    if (numericValues.some((value) => value >= sizes.tb.value)) {
        return 'tb';
    }

    if (numericValues.some((value) => value >= sizes.gb.value)) {
        return 'gb';
    }

    return 'mb';
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
    const numericValue = getNumericByteValue(value);

    if (numericValue === undefined) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    const shouldUseAdaptiveUnit = size !== undefined && numericValue < sizes[size].value;
    const formattedValue = shouldUseAdaptiveUnit
        ? formatTenantStorageAdaptiveMetric(numericValue)
        : formatTenantStorageSummaryMetric(numericValue, size);

    return formattedValue === EMPTY_DATA_PLACEHOLDER ? formattedValue : `~${formattedValue}`;
}

export function formatTenantStorageAdaptiveMetric(value?: string | number) {
    return formatByteMetric(value);
}

export function getTenantStorageLegendValueFormatter(values: Array<string | number | undefined>) {
    const numericValues = values
        .map((value) => getNumericByteValue(value))
        .filter((value): value is number => value !== undefined && value > 0);
    const minValue = Math.min(...numericValues);
    const maxValue = Math.max(...numericValues);
    const shouldUseMixedUnits =
        numericValues.length === 0 || maxValue / minValue >= MIXED_UNIT_RATIO_THRESHOLD;
    const commonSize = shouldUseMixedUnits ? undefined : getBytesSizeUnit(maxValue);

    return (value: number) => formatByteMetric(value, commonSize);
}

export function formatTenantStorageTableMetric(value?: string | number) {
    return formatTenantStorageAdaptiveMetric(value);
}

export function formatTenantStorageTooltipMetric(value?: string | number) {
    const numericValue = getNumericByteValue(value);

    if (numericValue === undefined) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    const formattedValue = formatNumber(numericValue);

    return formattedValue
        ? `${formattedValue}${UNBREAKABLE_GAP}${sizes.b.label}`
        : EMPTY_DATA_PLACEHOLDER;
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
