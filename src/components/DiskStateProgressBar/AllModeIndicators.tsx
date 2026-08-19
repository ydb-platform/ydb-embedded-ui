import {Icon, Text} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import type {AllModeIndicatorsState} from '../../utils/disks/displayState';

import {AllModeCapacityAlertIndicator} from './AllModeCapacityAlertIndicator';
import {DiskIconGroup} from './DiskIndicator';

const b = cn('storage-disk-progress-bar');

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
                <AllModeCapacityAlertIndicator indicator={indicators.capacityAlert} />
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
