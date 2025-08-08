import {formatBytes, getBytesSizeUnit} from '../bytesParsers';
import {
    formatNumber,
    formatNumericValues,
    formatStorageValues,
} from '../dataFormatters/dataFormatters';

import i18n from './i18n';

export interface MetricFormatParams {
    value: number;
    capacity: number;
}

export function formatStorageLegend({value, capacity}: MetricFormatParams): string {
    const formatted = formatStorageValues(value, capacity, undefined, '\n');
    return `${formatted[0]} ${i18n('context_of')} ${formatted[1]}`;
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
