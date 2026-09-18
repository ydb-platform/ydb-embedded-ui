import {CircleQuestionFill} from '@gravity-ui/icons';
import {Icon, Text} from '@gravity-ui/uikit';
import type {IconData} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import type {PDiskAllModeIndicatorsState} from '../../utils/disks/displayState';

import {AllModeCapacityAlertIndicator} from './AllModeCapacityAlertIndicator';
import {DiskIconGroup} from './DiskIndicator';

const b = cn('storage-disk-progress-bar');

interface PDiskAllModeIndicatorsProps {
    indicators: PDiskAllModeIndicatorsState;
}

function PDiskAllModeStatusIndicator({indicator}: {indicator?: IconData}) {
    if (!indicator) {
        return null;
    }

    const className =
        indicator === CircleQuestionFill ? b('all-mode-missing-data-indicator-icon') : undefined;

    return <Icon className={className} data={indicator} size={12} />;
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
                <PDiskAllModeStatusIndicator indicator={indicators.drive} />
            </span>
            <span className={b('pdisk-all-mode-decommit-indicator-slot')}>
                <PDiskAllModeStatusIndicator indicator={indicators.decommit} />
            </span>
            <span className={b('pdisk-all-mode-maintenance-indicator-slot')}>
                <PDiskAllModeStatusIndicator indicator={indicators.maintenance} />
            </span>
            <span className={b('pdisk-all-mode-device-indicator-slot')}>
                {indicators.device && <DiskIconGroup icons={indicators.device} />}
            </span>
        </div>
    );
}
