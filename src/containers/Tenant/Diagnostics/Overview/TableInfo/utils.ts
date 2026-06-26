import type {UpdateTablePartitioningParams} from '../../../../../types/store/partitioning';

import type {ManagePartitioningFormOutput} from './ManagePartitioningDialog/types';
import {splitToPartitionSizeMb} from './ManagePartitioningDialog/utils';

export function prepareUpdatePartitioningRequest(
    value: ManagePartitioningFormOutput,
    database: string,
    path: string,
): UpdateTablePartitioningParams {
    const {partitionSizeMb} = splitToPartitionSizeMb(value.splitSize, value.splitUnit);

    return {
        value: {
            partitionSizeMb,
            minPartitions: value.minimum,
            maxPartitions: value.maximum,
            splitByLoad: value.loadEnabled,
        },
        database,
        path,
    };
}
