import {isQueryErrorResponse, parseQueryAPIExecuteResponse} from '../../utils/query';

import {api} from './api';

function createOlatStatsQuery(path: string) {
    return `SELECT * FROM \`${path}/.sys/primary_index_stats\``;
}

const queryAction = 'execute-scan';

export const olapApi = api.injectEndpoints({
    endpoints: (build) => ({
        getOlapStats: build.query({
            queryFn: async ({path = ''}: {path?: string} = {}, {signal}) => {
                try {
                    const response = await window.api.sendQuery(
                        {
                            schema: 'modern',
                            query: createOlatStatsQuery(path),
                            database: path,
                            action: queryAction,
                        },
                        {signal},
                    );

                    if (isQueryErrorResponse(response)) {
                        return {error: response};
                    }

                    return {data: parseQueryAPIExecuteResponse(response)};
                } catch (error) {
                    return {error: error || new Error('Unauthorized')};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
