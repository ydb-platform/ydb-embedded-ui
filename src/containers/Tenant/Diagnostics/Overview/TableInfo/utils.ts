import type {UpdateTablePartitioningParams} from '../../../../../types/store/partitioning';
import {convertToBytes, sizes} from '../../../../../utils/bytesParsers';

import type {ManagePartitioningFormState} from './ManagePartitioningDialog/types';

export function prepareUpdatePartitioningRequest(
    value: ManagePartitioningFormState,
    database: string,
    path: string,
): UpdateTablePartitioningParams {
    const bytes = convertToBytes(Number(value.splitSize), value.splitUnit);
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
