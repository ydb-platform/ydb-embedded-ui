import {isQueryErrorResponse} from '../../../utils/query';
import {api} from '../api';

function createViewSchemaQuery(path: string) {
    return `SELECT * FROM \`${path}\` LIMIT 0`;
}

export const viewSchemaApi = api.injectEndpoints({
    endpoints: (build) => ({
        getViewSchema: build.query({
            queryFn: async ({database, path}: {database: string; path: string}) => {
                try {
                    const response = await window.api.sendQuery(
                        {
                            schema: 'modern',
                            query: createViewSchemaQuery(path),
                            database,
                            action: 'execute-scan',
                        },
                        {withRetries: true},
                    );

                    if (isQueryErrorResponse(response)) {
                        return {error: response};
                    }

                    return {data: response?.columns || []};
                } catch (error) {
                    return {error: error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
