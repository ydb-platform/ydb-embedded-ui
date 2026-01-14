import type {UpdateTablePartitioningParams} from '../../../../../types/store/partitioning';

import type {ManagePartitioningFormState} from './ManagePartitioningDialog/types';
import {splitToPartitionSizeMb} from './ManagePartitioningDialog/utils';

export function prepareUpdatePartitioningRequest(
    value: ManagePartitioningFormState,
    database: string,
    path: string,
): UpdateTablePartitioningParams {
    const {partitionSizeMb} = splitToPartitionSizeMb(Number(value.splitSize), value.splitUnit);

    return {
        value: {
            partitionSizeMb,
            minPartitions: Number(value.minimum),
            maxPartitions: Number(value.maximum),
            splitByLoad: value.loadEnabled,
        },
        database,
        path,
    };
}
