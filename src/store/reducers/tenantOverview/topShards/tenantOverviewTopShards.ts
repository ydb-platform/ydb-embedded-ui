import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../utils/constants';
import {isQueryErrorResponse, parseQueryAPIResponse} from '../../../../utils/query';
import {api} from '../../api';

function createShardQuery(path: string, tenantName?: string) {
    const pathSelect = tenantName
        ? `CAST(SUBSTRING(CAST(Path AS String), ${tenantName.length}) AS Utf8) AS Path`
        : 'Path';

    return `SELECT
    ${pathSelect},
    TabletId,
    CPUCores,
FROM \`.sys/partition_stats\`
WHERE
    Path='${path}'
    OR Path LIKE '${path}/%'
ORDER BY CPUCores DESC
LIMIT ${TENANT_OVERVIEW_TABLES_LIMIT}`;
}

const queryAction = 'execute-scan';

export const topShardsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getTopShards: builder.query({
            queryFn: async ({database, path = ''}: {database: string; path?: string}, {signal}) => {
                try {
                    const response = await window.api.sendQuery(
                        {
                            query: createShardQuery(path, database),
                            database,
                            action: queryAction,
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
