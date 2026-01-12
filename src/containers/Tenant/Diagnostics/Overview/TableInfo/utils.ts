import type {UpdateTablePartitioningParams} from '../../../../../types/store/partitioning';
import {sizes} from '../../../../../utils/bytesParsers';

import type {ManagePartitioningFormState} from './ManagePartitioningDialog/types';

export function prepareUpdatePartitioningRequest(
    value: ManagePartitioningFormState,
    database: string,
    path: string,
): UpdateTablePartitioningParams {
    const bytes = Number(value.splitSize) * sizes[value.splitUnit].value;
    const partitionSizeMb = Math.round(bytes / sizes.mb.value);

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
