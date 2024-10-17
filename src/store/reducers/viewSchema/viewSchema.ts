import type {Timeout} from '../../../types/api/query';
import {isQueryErrorResponse} from '../../../utils/query';
import {api} from '../api';

export function createViewSchemaQuery(path: string) {
    return `SELECT * FROM \`${path}\` LIMIT 0`;
}

export const viewSchemaApi = api.injectEndpoints({
    endpoints: (build) => ({
        getViewSchema: build.query({
            queryFn: async ({
                database,
                path,
                timeout,
                concurrentId,
            }: {
                database: string;
                path: string;
                timeout?: Timeout;
                concurrentId?: string;
            }) => {
                try {
                    const response = await window.api.sendQuery(
                        {
                            query: createViewSchemaQuery(path),
                            database,
                            action: 'execute-scan',
                            timeout,
                        },
                        {withRetries: true, concurrentId},
                    );

                    if (isQueryErrorResponse(response)) {
                        return {error: response};
                    }

                    return {data: response?.result?.[0]?.columns || []};
                } catch (error) {
                    return {error: error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
