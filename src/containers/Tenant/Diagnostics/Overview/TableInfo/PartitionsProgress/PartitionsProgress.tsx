import {Flex, Popover, Progress, Text} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {cn} from '../../../../../../utils/cn';

import {calcPartitionsProgress, getPartitionsLabel} from './helpers';
import i18n from './i18n';

import './PartitionsProgress.scss';

const b = cn('ydb-partitions-progress');

interface PartitionsProgressProps {
    minPartitions: number;
    maxPartitions?: number;
    partitionsCount: number;
    className?: string;
}

type SegmentPosition = 'left' | 'main' | 'right';

const SEGMENT_MODS: Record<SegmentPosition, Record<string, boolean>> = {
    left: {left: true},
    main: {main: true},
    right: {right: true},
};

const FULL_FILL_VALUE = 100;

interface SegmentProgressBarProps {
    position: SegmentPosition;
    value: number;
    tooltip: string;
    theme?: 'default' | 'danger';
}

const SegmentProgressBar = ({
    position,
    value,
    tooltip,
    theme = 'default',
}: SegmentProgressBarProps) => (
    <Popover hasArrow placement="top" content={tooltip} className={b('segment-touched')}>
        <div className={b('segment-bar', SEGMENT_MODS[position])}>
            <Progress value={value} size="s" theme={theme} />
        </div>
    </Popover>
);

export const PartitionsProgress = ({
    minPartitions,
    maxPartitions,
    partitionsCount,
    className,
}: PartitionsProgressProps) => {
    const {
        min,
        max,
        partitionsBelowMin,
        partitionsAboveMax,
        isBelowMin,
        isAboveMax,
        leftSegmentUnits,
        mainSegmentUnits,
        rightSegmentUnits,
        mainProgressValue,
    } = calcPartitionsProgress(minPartitions, maxPartitions, partitionsCount);

    const partitionsLabel = getPartitionsLabel(partitionsCount);

    const belowLimitTooltip = i18n('tooltip_partitions-below-limit', {
        count: partitionsCount,
        diff: partitionsBelowMin,
        partitions: partitionsLabel,
    });

    const aboveLimitTooltip = i18n('tooltip_partitions-above-limit', {
        count: partitionsCount,
        diff: partitionsAboveMax,
        partitions: partitionsLabel,
    });

    const currentTooltip = i18n('tooltip_partitions-current', {
        count: partitionsCount,
        partitions: partitionsLabel,
    });

    const maxLabel = isNil(max) ? i18n('value_no-limit') : max;

    return (
        <Flex alignItems="center" gap="0.5" className={b(null, className)}>
            {isBelowMin && (
                <Flex
                    style={{flexGrow: leftSegmentUnits}}
                    direction="column"
                    gap="2"
                    className={b('segment', SEGMENT_MODS.left)}
                >
                    <SegmentProgressBar
                        position="left"
                        value={FULL_FILL_VALUE}
                        tooltip={belowLimitTooltip}
                        theme="danger"
                    />

                    <div className={b('segment-labels', SEGMENT_MODS.left)}>
                        <Text variant="body-2" color="secondary">
                            {partitionsCount}
                        </Text>
                    </div>
                </Flex>
            )}

            <Flex
                direction="column"
                className={b('segment', SEGMENT_MODS.main)}
                style={{flexGrow: mainSegmentUnits}}
                gap="2"
            >
                <SegmentProgressBar
                    position="main"
                    value={mainProgressValue}
                    tooltip={currentTooltip}
                />

                <div className={b('segment-labels', SEGMENT_MODS.main)}>
                    <Text variant="body-2" color="secondary">
                        {min}
                    </Text>
                    <Text variant="body-2" color="secondary">
                        {maxLabel}
                    </Text>
                </div>
            </Flex>

            {isAboveMax && (
                <Flex
                    direction="column"
                    gap="2"
                    className={b('segment', SEGMENT_MODS.right)}
                    style={{flexGrow: rightSegmentUnits}}
                >
                    <SegmentProgressBar
                        position="right"
                        value={FULL_FILL_VALUE}
                        tooltip={aboveLimitTooltip}
                        theme="danger"
                    />

                    <div className={b('segment-labels', SEGMENT_MODS.right)}>
                        <Text variant="body-2" color="secondary">
                            {partitionsCount}
                        </Text>
                    </div>
                </Flex>
            )}
        </Flex>
    );
};
