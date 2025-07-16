import type {ExecuteActions} from '../../types/api/query';
import {isQueryErrorResponse, parseQueryAPIResponse} from '../../utils/query';

import {api} from './api';
import {prepareQueryWithPragmas} from './query/utils';

interface SendQueryParams {
    query?: string;
    database?: string;
    action?: ExecuteActions;
    limitRows?: number;
    pragmas?: string;
}

export const previewApi = api.injectEndpoints({
    endpoints: (build) => ({
        sendQuery: build.query({
            queryFn: async (
                {query, database, action, limitRows, pragmas}: SendQueryParams,
                {signal},
            ) => {
                try {
                    const finalQuery = prepareQueryWithPragmas(query || '', pragmas);
                    const response = await window.api.viewer.sendQuery(
                        {query: finalQuery, database, action, limit_rows: limitRows},
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
