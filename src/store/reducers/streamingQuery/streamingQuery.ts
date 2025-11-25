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

export const streamingQueriesApi = api.injectEndpoints({
    endpoints: (build) => ({
        getStreamingQueryInfo: build.query({
            queryFn: async ({database, path}: {database: string; path: string}, {signal}) => {
                try {
                    const response = await window.api.viewer.sendQuery(
                        {
                            query: getStreamingQueryInfoSQL(path),
                            database,
                            action: 'execute-query',
                            internal_call: true,
                        },
                        {signal, withRetries: true},
                    );

                    if (isQueryErrorResponse(response)) {
                        return {error: response};
                    }

                    const data = parseQueryAPIResponse(response);
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
