import {DEFAULT_DANGER_THRESHOLD, DEFAULT_WARNING_THRESHOLD} from './constants';

export type ProgressStatus = 'good' | 'warning' | 'danger';

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
