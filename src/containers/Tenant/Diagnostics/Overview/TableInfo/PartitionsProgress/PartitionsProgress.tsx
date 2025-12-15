import {Flex, Popover, Progress, Text} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {cn} from '../../../../../../utils/cn';

import {getPartitionsTooltip} from './helpers';
import i18n from './i18n';
import {FULL_FILL_VALUE, calcPartitionsProgress} from './utils';

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

    const tooltip = getPartitionsTooltip({
        count: partitionsCount,
        belowMin: partitionsBelowMin,
        aboveMax: partitionsAboveMax,
        isBelowMin: isBelowMin,
        isAboveMax: isAboveMax,
    });

    const maxLabel = isNil(max) ? i18n('value_no-limit') : max;

    return (
        <Popover hasArrow placement="top" content={tooltip} className={b('segment-touched')}>
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
