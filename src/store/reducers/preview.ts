import type {ExecuteActions} from '../../types/api/query';
import {isQueryErrorResponse, parseQueryAPIResponse} from '../../utils/query';

import {api} from './api';

interface SendQueryParams {
    query?: string;
    database?: string;
    action?: ExecuteActions;
    limitRows?: number;
}

export const previewApi = api.injectEndpoints({
    endpoints: (build) => ({
        sendQuery: build.query({
            queryFn: async ({query, database, action, limitRows}: SendQueryParams, {signal}) => {
                try {
                    const response = await window.api.viewer.sendQuery(
                        {query, database, action, limit_rows: limitRows},
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
            providesTags: ['PreviewData'],
        }),
    }),
    overrideExisting: 'throw',
});
