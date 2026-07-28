import type {LabelProps} from '@gravity-ui/uikit';

import type {ECapacityAlert} from '../types/api/enums';

import {DATA_SEVERITY} from './disks/constants';
import type {DataSeverity} from './disks/types';

const SEVERITY_TO_THEME: Record<DataSeverity, LabelProps['theme']> = {
    0: 'normal', // DATA_SEVERITY.GREY
    1: 'success', // DATA_SEVERITY.GREEN
    2: 'info', // DATA_SEVERITY.BLUE
    3: 'warning', // DATA_SEVERITY.YELLOW
    4: 'danger', // DATA_SEVERITY.ORANGE
    5: 'danger', // DATA_SEVERITY.RED
};

export function getCapacityAlertSeverity(capacityAlert?: ECapacityAlert): DataSeverity {
    switch (capacityAlert) {
        case 'GREEN':
        case 'CYAN':
            return DATA_SEVERITY.GREEN;
        case 'LIGHT_YELLOW':
            return DATA_SEVERITY.YELLOW;
        case 'YELLOW':
        case 'LIGHT_ORANGE':
        case 'PRE_ORANGE':
        case 'ORANGE':
        case 'RED':
        case 'BLACK':
            return DATA_SEVERITY.RED;
        default:
            return DATA_SEVERITY.GREY;
    }
}

export function getCapacityAlertTheme(capacityAlert?: ECapacityAlert): LabelProps['theme'] {
    const severity = getCapacityAlertSeverity(capacityAlert);
    return SEVERITY_TO_THEME[severity];
}
