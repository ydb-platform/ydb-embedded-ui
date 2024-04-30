import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../utils/constants';
import {parseQueryAPIExecuteResponse} from '../../../../utils/query';
import {api} from '../../api';

const getQueryText = (path: string) => {
    return `
SELECT
    Path, SUM(DataSize) as Size
FROM \`${path}/.sys/partition_stats\`
GROUP BY Path
    ORDER BY Size DESC
    LIMIT ${TENANT_OVERVIEW_TABLES_LIMIT}
`;
};

export const topTablesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getTopTables: builder.query({
            queryFn: async ({path}: {path: string}, {signal}) => {
                try {
                    const data = await window.api.sendQuery(
                        {
                            schema: 'modern',
                            query: getQueryText(path),
                            database: path,
                            action: 'execute-scan',
                        },
                        {signal},
                    );
                    return {data: parseQueryAPIExecuteResponse(data)};
                } catch (error) {
                    return {error: error || 'Unauthorized'};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
