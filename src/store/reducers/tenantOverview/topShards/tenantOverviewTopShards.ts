import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../utils/constants';
import {isQueryErrorResponse, parseQueryAPIResponse} from '../../../../utils/query';
import {createPartitionStatsQuery} from '../../../../utils/shardsQueryBuilders';
import {api} from '../../api';

function createShardQuery(path: string, databaseFullPath: string) {
    return createPartitionStatsQuery({
        databaseFullPath,
        path,
        selectFields: ['Path', 'TabletId', 'CPUCores'],
        sortOrder: [{columnId: 'CPUCores', order: -1}],
        limit: TENANT_OVERVIEW_TABLES_LIMIT,
    });
}

const queryAction = 'execute-scan';

export const topShardsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getTopShards: builder.query({
            queryFn: async (
                {
                    database,
                    path,
                    databaseFullPath,
                }: {database: string; path: string; databaseFullPath: string},
                {signal},
            ) => {
                try {
                    const response = await window.api.viewer.sendQuery(
                        {
                            query: createShardQuery(path, databaseFullPath),
                            database,
                            action: queryAction,
                            internal_call: true,
                        },
                        {signal, withRetries: true},
                    );

                    if (isQueryErrorResponse(response)) {
                        return {error: response};
                    }

                    return {data: parseQueryAPIResponse(response)};
                } catch (error) {
                    return {error: error || new Error('Unauthorized')};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
