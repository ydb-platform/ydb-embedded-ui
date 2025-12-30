import type {UpdateTablePartitioningParams} from '../../../../../types/store/partitioning';
import {sizes} from '../../../../../utils/bytesParsers';

import type {ManagePartitioningFormValues} from './ManagePartitioningDialog/utils';

export function prepareUpdatePartitioningRequest(
    value: ManagePartitioningFormValues,
    database: string,
    path: string,
): UpdateTablePartitioningParams {
    const bytes = value.splitSize * sizes[value.splitUnit].value;
    const partitionSizeMb = Math.round(bytes / sizes.mb.value);

    return {
        value: {
            partitionSizeMb,
            minPartitions: value.minimum,
            maxPartitions: value.maximum,
            splitByLoad: value.loadEnabled,
            loadPercent: value.loadEnabled ? value.loadPercent : undefined,
        },
        database,
        path,
    };
}
