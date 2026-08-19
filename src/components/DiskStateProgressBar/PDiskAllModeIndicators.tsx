import {Icon, Text} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import type {PDiskAllModeIndicatorsState} from '../../utils/disks/displayState';

import {AllModeCapacityAlertIndicator} from './AllModeCapacityAlertIndicator';
import {DiskIconGroup} from './DiskIndicator';

const b = cn('storage-disk-progress-bar');

interface PDiskAllModeIndicatorsProps {
    indicators: PDiskAllModeIndicatorsState;
}

export function PDiskAllModeIndicators({indicators}: PDiskAllModeIndicatorsProps) {
    return (
        <div className={b('pdisk-all-mode-indicators')}>
            <Text
                as="span"
                variant="caption-2"
                color="primary"
                className={b('pdisk-all-mode-capacity-alert-indicator-slot')}
            >
                <AllModeCapacityAlertIndicator indicator={indicators.capacityAlert} />
            </Text>
            <span className={b('pdisk-all-mode-drive-indicator-slot')}>
                {indicators.drive && <Icon data={indicators.drive} size={12} />}
            </span>
            <span className={b('pdisk-all-mode-decommit-indicator-slot')}>
                {indicators.decommit && <Icon data={indicators.decommit} size={12} />}
            </span>
            <span className={b('pdisk-all-mode-maintenance-indicator-slot')}>
                {indicators.maintenance && <Icon data={indicators.maintenance} size={12} />}
            </span>
            <span className={b('pdisk-all-mode-device-indicator-slot')}>
                {indicators.device && <DiskIconGroup icons={indicators.device} />}
            </span>
        </div>
    );
}
