import type {IconData} from '@gravity-ui/uikit';
import {Icon} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

const b = cn('storage-disk-progress-bar');

interface AllModeCapacityAlertIndicatorProps {
    indicator?: IconData | string;
}

export function AllModeCapacityAlertIndicator({indicator}: AllModeCapacityAlertIndicatorProps) {
    if (!indicator) {
        return null;
    }

    if (typeof indicator === 'string') {
        return indicator;
    }

    return (
        <Icon className={b('all-mode-capacity-alert-indicator-icon')} data={indicator} size={12} />
    );
}
