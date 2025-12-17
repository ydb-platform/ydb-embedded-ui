import {isNil} from 'lodash';

export const FULL_FILL_VALUE = 100;

// 20% warning segment when max is not provided: 1 / (1 + 4) = 20%
const NO_MAX_LEFT_UNITS = 1;
const NO_MAX_MAIN_UNITS = 4;

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
    const min = Math.max(1, minPartitions);

    if (isNil(maxPartitions)) {
        return calcPartitionsProgressWithoutMax(min, partitionsCount);
    }

    return calcPartitionsProgressWithMax(min, maxPartitions, partitionsCount);
}

export function calcPartitionsProgressWithoutMax(
    min: number,
    count: number,
): PartitionsProgressCalcResult {
    const partitionsBelowMin = Math.max(0, min - count);
    const isBelowMin = partitionsBelowMin > 0;

    const leftSegmentUnits = isBelowMin ? NO_MAX_LEFT_UNITS : 0;
    const mainSegmentUnits = isBelowMin ? NO_MAX_MAIN_UNITS : 1;

    return {
        min,
        max: undefined,

        partitionsBelowMin,
        partitionsAboveMax: 0,

        isBelowMin,
        isAboveMax: false,

        leftSegmentUnits,
        mainSegmentUnits,
        rightSegmentUnits: 0,

        mainProgressValue: count < min ? 0 : FULL_FILL_VALUE,
    };
}

export function calcPartitionsProgressWithMax(
    min: number,
    max: number,
    count: number,
): PartitionsProgressCalcResult {
    const normalizedMax = Math.max(max, min);
    const range = Math.max(0, normalizedMax - min);

    const partitionsBelowMin = Math.max(0, min - count);
    const partitionsAboveMax = Math.max(0, count - normalizedMax);

    const isBelowMin = partitionsBelowMin > 0;
    const isAboveMax = partitionsAboveMax > 0;

    const mainProgressValue = calcMainProgressValue(min, normalizedMax, range, count);

    return {
        min,
        max: normalizedMax,

        partitionsBelowMin,
        partitionsAboveMax,

        isBelowMin,
        isAboveMax,

        leftSegmentUnits: isBelowMin ? partitionsBelowMin : 0,
        mainSegmentUnits: range || 1,
        rightSegmentUnits: isAboveMax ? partitionsAboveMax : 0,

        mainProgressValue,
    };
}

function calcMainProgressValue(min: number, max: number, range: number, count: number) {
    if (range === 0) {
        return count >= min ? FULL_FILL_VALUE : 0;
    }

    if (count <= min) {
        return 0;
    }

    if (count >= max) {
        return FULL_FILL_VALUE;
    }

    return ((count - min) / range) * 100;
}
