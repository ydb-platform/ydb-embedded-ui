import type {LabelProps} from '@gravity-ui/uikit';

import type {ECapacityAlert} from '../types/api/enums';

export function getCapacityAlertTheme(capacityAlert?: string): LabelProps['theme'] {
    switch (capacityAlert as ECapacityAlert) {
        case 'GREEN':
        case 'CYAN':
            return 'success';
        case 'LIGHT_YELLOW':
            return 'warning';
        case 'YELLOW':
        case 'LIGHT_ORANGE':
        case 'PRE_ORANGE':
        case 'ORANGE':
        case 'RED':
        case 'BLACK':
            return 'danger';
        default:
            return 'normal';
    }
}
