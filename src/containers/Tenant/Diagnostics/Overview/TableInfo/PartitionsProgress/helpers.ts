import {isNil} from 'lodash';

import {FULL_FILL_VALUE} from './PartitionsProgress';
import i18n from './i18n';

export interface PartitionsProgressCalcResult {
    min: number;
    max?: number;

    partitionsBelowMin: number;
    partitionsAboveMax: number;

    isBelowMin: boolean;
    isAboveMax: boolean;

    leftSegmentUnits: number;
    mainSegmentUnits: number;
    rightSegmentUnits: number;

    mainProgressValue: number;
}

export function calcPartitionsProgress(
    minPartitions: number,
    maxPartitions: number | undefined,
    partitionsCount: number,
): PartitionsProgressCalcResult {
    const min = minPartitions;

    const hasMaxLimit = !isNil(maxPartitions);

    if (!hasMaxLimit) {
        const partitionsBelowMin = Math.max(0, min - partitionsCount);
        const partitionsAboveMax = 0;
        const isBelowMin = partitionsBelowMin > 0;
        const isAboveMax = false;

        // When max limit is not provided, reserve a fixed 20% of the total width
        // for the "below min" segment (1:4 ratio between warning and main segments).
        const leftSegmentUnits = isBelowMin ? 1 : 0;
        const mainSegmentUnits = isBelowMin ? 4 : 1;
        const rightSegmentUnits = 0;

        const mainProgressValue = partitionsCount < min ? 0 : FULL_FILL_VALUE;

        return {
            min,
            max: undefined,

            partitionsBelowMin,
            partitionsAboveMax,

            isBelowMin,
            isAboveMax,

            leftSegmentUnits,
            mainSegmentUnits,
            rightSegmentUnits,

            mainProgressValue,
        };
    }

    const max = Math.max(maxPartitions as number, minPartitions);

    const range = Math.max(0, max - min);

    const partitionsBelowMin = Math.max(0, min - partitionsCount);
    const partitionsAboveMax = Math.max(0, partitionsCount - max);

    const isBelowMin = partitionsBelowMin > 0;
    const isAboveMax = partitionsAboveMax > 0;

    const mainSegmentUnits = range || 1;

    let mainProgressValue = 0;
    if (range > 0) {
        if (partitionsCount <= min) {
            mainProgressValue = 0;
        } else if (partitionsCount >= max) {
            mainProgressValue = FULL_FILL_VALUE;
        } else {
            mainProgressValue = ((partitionsCount - min) / range) * 100;
        }
    }

    const leftSegmentUnits = isBelowMin ? partitionsBelowMin : 0;
    const rightSegmentUnits = isAboveMax ? partitionsAboveMax : 0;

    return {
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
    };
}

export const getPartitionsLabel = (count: number) =>
    count === 1 ? i18n('value_partition-one') : i18n('value_partition-many');
