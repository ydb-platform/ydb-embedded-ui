import type {UpdateTablePartitioningParams} from '../../../../../types/store/partitioning';

import type {ManagePartitioningFormOutput} from './ManagePartitioningDialog/types';
import {splitToPartitionSizeMb} from './ManagePartitioningDialog/utils';

export function prepareUpdatePartitioningRequest(
    value: ManagePartitioningFormOutput,
    database: string,
    path: string,
): UpdateTablePartitioningParams {
    const commonValues = {
        minPartitions: value.minimum,
        maxPartitions: value.maximum,
        splitByLoad: value.loadEnabled,
    };

    if (!value.splitSizeEnabled) {
        return {
            value: {
                ...commonValues,
                splitBySize: false,
            },
            database,
            path,
        };
    }

    const {partitionSizeMb} = splitToPartitionSizeMb(value.splitSize, value.splitUnit);

    return {
        value: {
            ...commonValues,
            splitBySize: true,
            partitionSizeMb,
        },
        database,
        path,
    };
}
