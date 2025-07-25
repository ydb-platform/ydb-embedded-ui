import type {FormatProgressViewerValues} from '../../utils/progress';
import {isNumeric, safeParseNumber} from '../../utils/utils';

import i18n from './i18n';

// Constants that were previously in TenantStorage/constants
export const DEFAULT_PROGRESS_WIDTH = 400;
export const MAX_PERCENTAGE = 100;
export const MIN_PERCENTAGE = 0;
export const PROGRESS_SIZE = 's';

export const isValidValue = (val?: number | string): boolean =>
    isNumeric(val) && safeParseNumber(val) >= 0;

export function calculateProgressWidth(value: number, capacity: number): number {
    const rawPercentage =
        capacity > 0 ? Math.floor((value / capacity) * MAX_PERCENTAGE) : MAX_PERCENTAGE;
    const fillWidth = Math.max(MIN_PERCENTAGE, rawPercentage);
    return Math.min(fillWidth, MAX_PERCENTAGE);
}

export function getProgressStyle(width?: number | 'full') {
    const isFullWidth = width === 'full';
    const validatedWidth = isFullWidth ? 0 : Math.max(0, width || DEFAULT_PROGRESS_WIDTH);

    return {
        width: isFullWidth ? '100%' : `${validatedWidth}px`,
        flex: isFullWidth ? '1' : 'none',
    };
}

export function formatProgressText(
    valueText: string | number | undefined,
    capacityText: string | number | undefined,
    numericCapacity: number,
): string {
    if (numericCapacity <= 0) {
        return String(valueText);
    }
    return i18n('context_capacity-usage', {value: valueText, capacity: capacityText});
}

export function formatDisplayValues(
    value: number | string | undefined,
    capacity: number | string | undefined,
    formatValues?: FormatProgressViewerValues,
): [string | number | undefined, string | number | undefined] {
    if (formatValues) {
        const result = formatValues(Number(value), Number(capacity));
        return [result[0], result[1]] as [string | number | undefined, string | number | undefined];
    }
    return [value, capacity];
}
