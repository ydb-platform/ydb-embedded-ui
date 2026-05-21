import type {UpdateTablePartitioningParams} from '../../../../../types/store/partitioning';
import {sizes} from '../../../../../utils/bytesParsers';

import type {ManagePartitioningFormState} from './ManagePartitioningDialog/types';
import {splitToPartitionSizeMb} from './ManagePartitioningDialog/utils';
import {DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES} from './constants';

export function prepareUpdatePartitioningRequest(
    value: ManagePartitioningFormState,
    database: string,
    path: string,
): UpdateTablePartitioningParams {
    const splitSizeValue = Number(value.splitSize);
    const hasValidSplitSize = Number.isFinite(splitSizeValue) && splitSizeValue > 0;
    const fallbackPartitionSizeMb = Math.round(
        DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES / sizes.mb.value,
    );
    const {partitionSizeMb} =
        value.splitSizeEnabled && hasValidSplitSize
            ? splitToPartitionSizeMb(splitSizeValue, value.splitUnit)
            : {partitionSizeMb: fallbackPartitionSizeMb};

    return {
        value: {
            splitBySize: value.splitSizeEnabled,
            partitionSizeMb,
            minPartitions: Number(value.minimum),
            maxPartitions: Number(value.maximum),
            splitByLoad: value.loadEnabled,
        },
        database,
        path,
    };
}
