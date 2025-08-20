import {QUERY_TECHNICAL_MARK, TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../utils/constants';
import {isQueryErrorResponse, parseQueryAPIResponse} from '../../../../utils/query';
import {api} from '../../api';

function createShardQuery(path: string, database: string) {
    const pathSelect = `CAST(SUBSTRING(CAST(Path AS String), ${database.length}) AS Utf8) AS RelativePath`;
    return `${QUERY_TECHNICAL_MARK}
SELECT
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
                    const response = await window.api.viewer.sendQuery(
                        {
                            query: createShardQuery(path, database),
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
