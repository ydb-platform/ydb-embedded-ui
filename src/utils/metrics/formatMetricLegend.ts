import type {BytesSizes} from '../bytesParsers';
import {formatBytes, getBytesSizeUnit, sizes} from '../bytesParsers';
import {
    formatNumber,
    formatNumericValues,
    formatStorageValues,
} from '../dataFormatters/dataFormatters';
import {
    getConsistentMetricBytesSize,
    getConvertedMetricBytesDecimalPlaces,
    getMetricBytesDisplaySize,
} from '../storageMetrics';

import i18n from './i18n';

export interface MetricFormatParams {
    value: number;
    capacity: number;
}

function getFormatBytesPrecision(value: number, size: BytesSizes) {
    const convertedValue = Number(value) / sizes[size].value;
    const decimalPlaces = getConvertedMetricBytesDecimalPlaces(size, convertedValue);
    const absoluteConvertedValue = Math.abs(convertedValue);

    if (!Number.isFinite(absoluteConvertedValue) || absoluteConvertedValue < 1) {
        return decimalPlaces;
    }

    return String(Math.trunc(absoluteConvertedValue)).length + decimalPlaces;
}

export function formatStorageLegend({value, capacity}: MetricFormatParams): string {
    const size = getConsistentMetricBytesSize([value, capacity]);
    const formatted = formatStorageValues(value, capacity, size, '\n', false, {
        value: getFormatBytesPrecision(value, size),
        total: getFormatBytesPrecision(capacity, size),
    });

    return `${formatted[0]} ${i18n('context_of')} ${formatted[1]}`;
}

export function formatNetworkMetric(value?: string | number) {
    const numericValue = Number(value);
    const size = getMetricBytesDisplaySize(numericValue);

    return formatBytes({
        value,
        size,
        precision: getFormatBytesPrecision(numericValue, size),
        withSpeedLabel: true,
    });
}

export function formatCoresLegend({value, capacity}: MetricFormatParams): string {
    let formatted = [];
    if (capacity < 10_000) {
        formatted = [formatNumber(Math.round(value)), formatNumber(Math.round(capacity))];
    } else {
        formatted = formatNumericValues(value, capacity, undefined, '', true);
    }
    return `${formatted[0]} ${i18n('context_of')} ${formatted[1]} ${i18n('context_cores')}`;
}

export function formatSpeedLegend({value, capacity}: MetricFormatParams): string {
    // Determine unit based on capacity
    const unit = getBytesSizeUnit(capacity);

    // Format used value without units
    const usedSpeed = formatBytes({
        value,
        size: unit,
        precision: 2,
        withSpeedLabel: false,
        withSizeLabel: false,
    });

    // Format limit with speed units
    const limitSpeed = formatBytes({
        value: capacity,
        size: unit,
        precision: 2,
        withSpeedLabel: true,
    });

    return `${usedSpeed} ${i18n('context_of')} ${limitSpeed}`;
}
