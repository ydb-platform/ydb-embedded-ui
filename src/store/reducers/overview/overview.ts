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
                }: {path: string; database: string; timeout?: number; databaseFullPath: string},
                {signal},
            ) => {
                try {
                    const data = await window.api.viewer.getDescribe(
                        {
                            path: {path, databaseFullPath},
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
