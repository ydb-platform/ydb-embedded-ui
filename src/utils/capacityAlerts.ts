import type {LabelProps} from '@gravity-ui/uikit';

export function getCapacityAlertTheme(capacityAlert?: string): LabelProps['theme'] {
    switch (capacityAlert) {
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
