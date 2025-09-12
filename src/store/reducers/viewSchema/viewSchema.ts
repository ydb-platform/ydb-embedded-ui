import {transformPath} from '../../../containers/Tenant/ObjectSummary/transformPath';
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
                databaseFullPath,
                timeout,
            }: {
                database: string;
                path: string;
                databaseFullPath: string;
                timeout?: number;
            }) => {
                try {
                    const relativePath = transformPath(path, databaseFullPath);
                    const response = await window.api.viewer.sendQuery(
                        {
                            query: createViewSchemaQuery(relativePath),
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
