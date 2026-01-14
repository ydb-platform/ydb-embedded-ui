import type {
    UpdateTablePartitioningParams,
    UpdateTablePartitioningValues,
} from '../../../types/store/partitioning';
import {QUERY_TECHNICAL_MARK} from '../../../utils/constants';
import {isQueryErrorResponse} from '../../../utils/query';
import {api} from '../api';

function alterPartitioningSQL(path: string, values: UpdateTablePartitioningValues) {
    const safePath = path.replace(/`/g, '``');

    const byLoad = values.splitByLoad ? 'ENABLED' : 'DISABLED';

    return `${QUERY_TECHNICAL_MARK}
ALTER TABLE \`${safePath}\` SET (
    AUTO_PARTITIONING_BY_SIZE = ENABLED,
    AUTO_PARTITIONING_PARTITION_SIZE_MB = ${values.partitionSizeMb},
    AUTO_PARTITIONING_MIN_PARTITIONS_COUNT = ${values.minPartitions},
    AUTO_PARTITIONING_MAX_PARTITIONS_COUNT = ${values.maxPartitions},
    AUTO_PARTITIONING_BY_LOAD = ${byLoad}
)`;
}

export const tablePartitioningApi = api.injectEndpoints({
    endpoints: (build) => ({
        updateTablePartitioning: build.mutation<void, UpdateTablePartitioningParams>({
            queryFn: async (params, {signal}) => {
                try {
                    const response = await window.api.viewer.sendQuery(
                        {
                            query: alterPartitioningSQL(params.path, params.value),
                            database: params.database,
                            action: 'execute-query',
                            internal_call: true,
                        },
                        {signal, withRetries: true},
                    );

                    if (isQueryErrorResponse(response)) {
                        return {error: response.error};
                    }

                    return {data: undefined};
                } catch (error) {
                    return {error};
                }
            },
            invalidatesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
