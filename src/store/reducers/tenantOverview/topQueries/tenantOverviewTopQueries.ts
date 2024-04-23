import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../utils/constants';
import {parseQueryAPIExecuteResponse} from '../../../../utils/query';
import {api} from '../../api';

const getQueryText = (path: string) => {
    return `
SELECT
    CPUTime as CPUTimeUs,
    QueryText,
FROM \`${path}/.sys/top_queries_by_cpu_time_one_hour\`
ORDER BY CPUTimeUs DESC
LIMIT ${TENANT_OVERVIEW_TABLES_LIMIT}
`;
};

export const topQueriesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getTopQueries: builder.query({
            queryFn: async ({database}: {database: string}, {signal}) => {
                try {
                    const data = await window.api.sendQuery(
                        {
                            schema: 'modern',
                            query: getQueryText(database),
                            database,
                            action: 'execute-scan',
                        },
                        {signal},
                    );
                    return {data: parseQueryAPIExecuteResponse(data)};
                } catch (error) {
                    return {error: error || new Error('Unauthorized')};
                }
            },
            providesTags: ['All'],
        }),
    }),
});
