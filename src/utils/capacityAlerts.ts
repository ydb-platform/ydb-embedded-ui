import type {LabelProps} from '@gravity-ui/uikit';

import {DISK_COLOR_STATE_TO_NUMERIC_SEVERITY} from './disks/constants';

type NumericSeverity =
    (typeof DISK_COLOR_STATE_TO_NUMERIC_SEVERITY)[keyof typeof DISK_COLOR_STATE_TO_NUMERIC_SEVERITY];

const SEVERITY_TO_THEME: Record<NumericSeverity, LabelProps['theme']> = {
    [DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey]: 'normal',
    [DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green]: 'success',
    [DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue]: 'info',
    [DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow]: 'warning',
    [DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Orange]: 'danger',
    [DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red]: 'danger',
};

export function getCapacityAlertSeverity(capacityAlert?: string): NumericSeverity {
    switch (capacityAlert) {
        case 'GREEN':
        case 'CYAN':
            return DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green;
        case 'LIGHT_YELLOW':
            return DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow;
        case 'YELLOW':
        case 'LIGHT_ORANGE':
        case 'PRE_ORANGE':
        case 'ORANGE':
        case 'RED':
        case 'BLACK':
            return DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red;
        default:
            return DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Grey;
    }
}

export function getCapacityAlertTheme(capacityAlert?: string): LabelProps['theme'] {
    const severity = getCapacityAlertSeverity(capacityAlert);
    return SEVERITY_TO_THEME[severity];
}
