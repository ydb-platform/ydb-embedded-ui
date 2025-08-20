import {isQueryErrorResponse} from '../../../utils/query';
import {api} from '../api';

function createViewSchemaQuery(path: string) {
    return `SELECT * FROM \`${path}\` LIMIT 0`;
}

export const viewSchemaApi = api.injectEndpoints({
    endpoints: (build) => ({
        getViewSchema: build.query({
            queryFn: async ({
                database,
                path,
                timeout,
            }: {
                database: string;
                path: string;
                timeout?: number;
            }) => {
                try {
                    const response = await window.api.viewer.sendQuery(
                        {
                            query: createViewSchemaQuery(path),
                            database,
                            action: 'execute-scan',
                            timeout,
                            internal_call: true,
                        },
                        {withRetries: true},
                    );

                    if (isQueryErrorResponse(response)) {
                        return {error: response};
                    }

                    return {data: response?.result?.[0]?.columns || []};
                } catch (error) {
                    return {error: error};
                }
            },
            serializeQueryArgs: ({queryArgs}) => {
                const {database, path} = queryArgs;
                return {database, path};
            },
            providesTags: ['All', 'SchemaTree'],
        }),
    }),
    overrideExisting: 'throw',
});
