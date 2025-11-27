import {QUERY_TECHNICAL_MARK} from '../../../utils/constants';
import {isQueryErrorResponse, parseQueryAPIResponse} from '../../../utils/query';
import {api} from '../api';

function getShowCreateTableSQL(path: string) {
    const safePath = path.replace(/`/g, '``');
    return `${QUERY_TECHNICAL_MARK}
SHOW CREATE TABLE \`${safePath}\``;
}

export const showCreateTableApi = api.injectEndpoints({
    endpoints: (build) => ({
        getShowCreateTable: build.query({
            queryFn: async ({database, path}: {database: string; path: string}, {signal}) => {
                try {
                    const response = await window.api.viewer.sendQuery(
                        {
                            query: getShowCreateTableSQL(path),
                            database,
                            action: 'execute-query',
                        },
                        {signal, withRetries: true},
                    );

                    if (isQueryErrorResponse(response)) {
                        return {error: response};
                    }

                    const data = parseQueryAPIResponse(response);

                    const result = data?.resultSets?.[0]?.result || [];

                    const showCreateTableQuery = result[0]?.CreateQuery;

                    return {data: showCreateTableQuery};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
