import {QUERY_TECHNICAL_MARK, TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../utils/constants';
import {isQueryErrorResponse, parseQueryAPIResponse} from '../../../../utils/query';
import {api} from '../../api';

const getQueryText = () => {
    return `${QUERY_TECHNICAL_MARK}
SELECT
    Path, SUM(DataSize) as Size
FROM \`.sys/partition_stats\`
GROUP BY Path
ORDER BY Size DESC
LIMIT ${TENANT_OVERVIEW_TABLES_LIMIT}
`;
};

export const topTablesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getTopTables: builder.query({
            queryFn: async ({database}: {database: string}, {signal}) => {
                try {
                    const response = await window.api.viewer.sendQuery(
                        {
                            query: getQueryText(),
                            database,
                            action: 'execute-query',
                            internal_call: true,
                        },
                        {signal, withRetries: true},
                    );

                    if (isQueryErrorResponse(response)) {
                        return {error: response};
                    }

                    return {data: parseQueryAPIResponse(response)};
                } catch (error) {
                    return {error: error || 'Unauthorized'};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
