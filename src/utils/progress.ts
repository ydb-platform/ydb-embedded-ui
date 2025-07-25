import {formatBytes} from './bytesParsers';
import {DEFAULT_DANGER_THRESHOLD, DEFAULT_WARNING_THRESHOLD} from './constants';
import {formatNumber, roundToPrecision} from './dataFormatters/dataFormatters';

export type ProgressStatus = 'good' | 'warning' | 'danger';

export type FormatProgressViewerValues = (
    value?: number,
    capacity?: number,
) => (string | number | undefined)[];

const formatValue = (value?: number) => {
    return formatNumber(roundToPrecision(value || 0, 2));
};

export const defaultFormatProgressValues: FormatProgressViewerValues = (value, total) => {
    return [formatValue(value), formatValue(total)];
};

export function formatSegmentValue(value: number, capacity?: number): string {
    if (capacity) {
        const usedValue = formatBytes({
            value,
            size: 'tb',
            withSizeLabel: false,
            precision: 2,
        });
        const totalValue = formatBytes({
            value: capacity,
            size: 'tb',
            withSizeLabel: true,
            precision: 0,
        });
        return `${usedValue} of ${totalValue}`;
    }

    return formatBytes({
        value,
        size: 'gb',
        withSizeLabel: true,
        precision: 1,
    });
}

interface CalculateProgressStatusProps {
    inverseColorize?: boolean;
    dangerThreshold?: number;
    warningThreshold?: number;
    colorizeProgress?: boolean;
    fillWidth: number;
}

export function calculateProgressStatus({
    inverseColorize,
    warningThreshold = DEFAULT_WARNING_THRESHOLD,
    dangerThreshold = DEFAULT_DANGER_THRESHOLD,
    colorizeProgress,
    fillWidth,
}: CalculateProgressStatusProps) {
    let status: ProgressStatus = inverseColorize ? 'danger' : 'good';
    if (colorizeProgress) {
        if (fillWidth > warningThreshold && fillWidth <= dangerThreshold) {
            status = 'warning';
        } else if (fillWidth > dangerThreshold) {
            status = inverseColorize ? 'good' : 'danger';
        }
    }
    return status;
}
