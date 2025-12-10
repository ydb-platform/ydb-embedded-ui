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

type SegmentPosition = 'main' | 'additional';

const SEGMENT_MODS: Record<SegmentPosition, Record<string, boolean>> = {
    additional: {additional: true},
    main: {main: true},
};

export const FULL_FILL_VALUE = 100;

interface SegmentProgressBarProps {
    position: SegmentPosition;
    value: number;
}

const SegmentProgressBar = ({position, value}: SegmentProgressBarProps) => (
    <div className={b('segment-bar', SEGMENT_MODS[position])}>
        <Progress value={value} size="s" />
    </div>
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

    let tooltipContent = currentTooltip;
    if (isBelowMin) {
        tooltipContent = belowLimitTooltip;
    } else if (isAboveMax) {
        tooltipContent = aboveLimitTooltip;
    }

    return (
        <Popover hasArrow placement="top" content={tooltipContent} className={b('segment-touched')}>
            <Flex alignItems="center" gap="0.5" className={b(null, className)}>
                {isBelowMin && (
                    <Flex
                        style={{flexGrow: leftSegmentUnits}}
                        direction="column"
                        gap="2"
                        className={b('segment', SEGMENT_MODS.additional)}
                    >
                        <SegmentProgressBar position="additional" value={FULL_FILL_VALUE} />

                        <Flex justifyContent="flex-start">
                            <Text variant="body-2" color="secondary">
                                {partitionsCount}
                            </Text>
                        </Flex>
                    </Flex>
                )}

                <Flex
                    direction="column"
                    className={b('segment', SEGMENT_MODS.main)}
                    style={{flexGrow: mainSegmentUnits}}
                    gap="2"
                >
                    <SegmentProgressBar position="main" value={mainProgressValue} />

                    <Flex justifyContent="space-between">
                        <Text variant="body-2" color="secondary">
                            {min}
                        </Text>
                        <Text variant="body-2" color="secondary">
                            {maxLabel}
                        </Text>
                    </Flex>
                </Flex>

                {isAboveMax && (
                    <Flex
                        direction="column"
                        gap="2"
                        className={b('segment', SEGMENT_MODS.additional)}
                        style={{flexGrow: rightSegmentUnits}}
                    >
                        <SegmentProgressBar position="additional" value={FULL_FILL_VALUE} />

                        <Flex justifyContent="flex-end">
                            <Text variant="body-2" color="secondary">
                                {partitionsCount}
                            </Text>
                        </Flex>
                    </Flex>
                )}
            </Flex>
        </Popover>
    );
};
