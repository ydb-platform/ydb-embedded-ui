import {QUERY_TECHNICAL_MARK} from '../../../utils/constants';
import {isQueryErrorResponse, parseQueryAPIResponse} from '../../../utils/query';
import {api} from '../api';

function getStreamingQueryInfoSQL(path: string) {
    const safePath = path.replace(/'/g, "''");
    return `${QUERY_TECHNICAL_MARK}
SELECT
    Status AS State,
    Issues AS Error,
    Text
FROM \`.sys/streaming_queries\`
WHERE Path = '${safePath}'
LIMIT 1`;
}

function getStreamingQueryPlanSQL(path: string) {
    const safePath = path.replace(/'/g, "''");
    return `${QUERY_TECHNICAL_MARK}
SELECT
    Status,
    Issues,
    Plan
FROM \`.sys/streaming_queries\`
WHERE Path = '${safePath}'
LIMIT 1`;
}

async function execStreamingSQL(
    sql: string,
    {database, signal}: {database: string; signal: AbortSignal},
) {
    const response = await window.api.viewer.sendQuery(
        {query: sql, database, action: 'execute-query', internal_call: true},
        {signal, withRetries: true},
    );
    if (isQueryErrorResponse(response)) {
        return {error: response};
    }
    return {data: parseQueryAPIResponse(response)};
}

export const streamingQueriesApi = api.injectEndpoints({
    endpoints: (build) => ({
        getStreamingQueryInfo: build.query({
            queryFn: async ({database, path}: {database: string; path: string}, {signal}) => {
                try {
                    return await execStreamingSQL(getStreamingQueryInfoSQL(path), {
                        database,
                        signal,
                    });
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
        getStreamingQueryPlan: build.query({
            queryFn: async ({database, path}: {database: string; path: string}, {signal}) => {
                try {
                    return await execStreamingSQL(getStreamingQueryPlanSQL(path), {
                        database,
                        signal,
                    });
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
