import type {ExecuteActions} from '../../types/api/query';
import {parseQueryAPIExecuteResponse} from '../../utils/query';

import {api} from './api';

interface SendQueryParams {
    query?: string;
    database?: string;
    action?: ExecuteActions;
}

export const previewApi = api.injectEndpoints({
    endpoints: (build) => ({
        sendQuery: build.query({
            queryFn: async ({query, database, action}: SendQueryParams, {signal}) => {
                try {
                    const response = await window.api.sendQuery(
                        {schema: 'modern', query, database, action},
                        {signal},
                    );
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
