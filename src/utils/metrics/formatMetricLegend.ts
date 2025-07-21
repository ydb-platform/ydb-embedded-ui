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
