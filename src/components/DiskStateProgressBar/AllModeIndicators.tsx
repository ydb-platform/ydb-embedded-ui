import {CircleQuestionFill} from '@gravity-ui/icons';
import {Icon, Text} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import type {AllModeIndicatorsState} from '../../utils/disks/displayState';

import {AllModeCapacityAlertIndicator} from './AllModeCapacityAlertIndicator';
import {DiskIconGroup} from './DiskIndicator';

const b = cn('storage-disk-progress-bar');

interface AllModeIndicatorsProps {
    indicators: AllModeIndicatorsState;
    size?: 's' | 'm';
}

export function AllModeIndicators({indicators, size = 'm'}: AllModeIndicatorsProps) {
    const iconSize = size === 's' ? 8 : 12;
    const iconGroupSize = size === 's' ? 8 : 10;

    return (
        <div className={b('all-mode-indicators', {size})}>
            <Text
                as="span"
                variant="caption-2"
                color="primary"
                className={b('all-mode-capacity-alert-indicator-slot', {size})}
            >
                <AllModeCapacityAlertIndicator
                    indicator={indicators.capacityAlert}
                    iconSize={iconSize}
                />
            </Text>
            <span className={b('all-mode-front-queues-indicator-slot')}>
                {indicators.frontQueues && (
                    <Icon
                        className={
                            indicators.frontQueues === CircleQuestionFill
                                ? b('all-mode-missing-data-indicator-icon')
                                : undefined
                        }
                        data={indicators.frontQueues}
                        size={iconSize}
                    />
                )}
            </span>
            <div className={b('all-mode-compaction-indicator-slot')}>
                {indicators.compaction && (
                    <DiskIconGroup
                        icons={indicators.compaction}
                        size={iconGroupSize}
                        className={b('all-mode-compaction-icons', {size})}
                    />
                )}
            </div>
        </div>
    );
}
