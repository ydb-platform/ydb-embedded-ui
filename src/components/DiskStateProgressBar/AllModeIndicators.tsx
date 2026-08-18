import type {IconData} from '@gravity-ui/uikit';
import {Icon, Text} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import type {AllModeIndicatorsState} from '../../utils/disks/displayState';

import {DiskIconGroup} from './DiskIndicator';

const b = cn('storage-disk-progress-bar');

function renderCapacityAlertIndicator(indicator?: IconData | string) {
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

interface AllModeIndicatorsProps {
    indicators: AllModeIndicatorsState;
}

export function AllModeIndicators({indicators}: AllModeIndicatorsProps) {
    return (
        <div className={b('all-mode-indicators')}>
            <Text
                as="span"
                variant="caption-2"
                color="primary"
                className={b('all-mode-capacity-alert-indicator-slot')}
            >
                {renderCapacityAlertIndicator(indicators.capacityAlert)}
            </Text>
            <span className={b('all-mode-front-queues-indicator-slot')}>
                {indicators.frontQueues && <Icon data={indicators.frontQueues} size={12} />}
            </span>
            <div className={b('all-mode-compaction-indicator-slot')}>
                {indicators.compaction && <DiskIconGroup icons={indicators.compaction} />}
            </div>
        </div>
    );
}
