import type {IconData} from '@gravity-ui/uikit';
import {Icon} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

const b = cn('storage-disk-progress-bar');

interface AllModeCapacityAlertIndicatorProps {
    indicator?: IconData | string;
    iconSize?: number;
}

export function AllModeCapacityAlertIndicator({
    indicator,
    iconSize = 12,
}: AllModeCapacityAlertIndicatorProps) {
    if (!indicator) {
        return null;
    }

    if (typeof indicator === 'string') {
        return indicator;
    }

    return (
        <Icon
            className={b('all-mode-missing-data-indicator-icon')}
            data={indicator}
            size={iconSize}
        />
    );
}
