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

interface CalculateProgressStatusProps {
    dangerThreshold?: number;
    warningThreshold?: number;
    colorizeProgress?: boolean;
    fillWidth: number;
}

export function calculateProgressStatus({
    warningThreshold = DEFAULT_WARNING_THRESHOLD,
    dangerThreshold = DEFAULT_DANGER_THRESHOLD,
    colorizeProgress,
    fillWidth,
}: CalculateProgressStatusProps) {
    let status: ProgressStatus = 'good';
    if (colorizeProgress) {
        if (fillWidth > warningThreshold && fillWidth <= dangerThreshold) {
            status = 'warning';
        } else if (fillWidth > dangerThreshold) {
            status = 'danger';
        }
    }
    return status;
}
