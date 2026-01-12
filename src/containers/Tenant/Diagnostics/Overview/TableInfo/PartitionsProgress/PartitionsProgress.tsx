import {Flex, Popover, Text} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {cn} from '../../../../../../utils/cn';
import {formatNumber} from '../../../../../../utils/dataFormatters/dataFormatters';

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
    withMinFill?: boolean;
}

const SegmentProgressBar = ({position, value, withMinFill}: SegmentProgressBarProps) => {
    const width = `${value}%`;

    return (
        <div
            className={b('segment-bar', SEGMENT_MODS[position])}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={FULL_FILL_VALUE}
            aria-valuenow={value}
        >
            <div className={b('segment-fill', {'min-fill': withMinFill})} style={{width}} />
        </div>
    );
};

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

    const minLabel = formatNumber(min);
    const maxLabel = isNil(max) ? i18n('value_no-limit') : formatNumber(max);
    const currentLabel = formatNumber(partitionsCount);

    const hasAdditionalSegments = isBelowMin || isAboveMax;
    const withMinFill = !hasAdditionalSegments;

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
                                {currentLabel}
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
                    <SegmentProgressBar
                        position="main"
                        value={mainProgressValue}
                        withMinFill={withMinFill}
                    />

                    <Flex justifyContent="space-between" gap="2">
                        <Text variant="body-2" color="secondary">
                            {minLabel}
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
                                {currentLabel}
                            </Text>
                        </Flex>
                    </Flex>
                )}
            </Flex>
        </Popover>
    );
};
