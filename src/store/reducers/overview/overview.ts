import {api} from '../api';

export const overviewApi = api.injectEndpoints({
    endpoints: (build) => ({
        getOverview: build.query({
            queryFn: async (
                {
                    path,
                    database,
                    timeout,
                    databaseFullPath,
                    useMetaProxy,
                }: {
                    path: string;
                    database: string;
                    timeout?: number;
                    databaseFullPath: string;
                    useMetaProxy?: boolean;
                },
                {signal},
            ) => {
                try {
                    const data = await window.api.viewer.getDescribe(
                        {
                            path: {path, databaseFullPath, useMetaProxy},
                            database,
                            timeout,
                        },
                        {signal},
                    );
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            serializeQueryArgs: ({queryArgs}) => {
                const {database, path} = queryArgs;
                return {database, path};
            },
            keepUnusedDataFor: 0,
            providesTags: ['All', 'SchemaTree'],
        }),
    }),
});
