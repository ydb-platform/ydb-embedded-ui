import {api} from '../api';

export const overviewApi = api.injectEndpoints({
    endpoints: (build) => ({
        getOverview: build.query({
            queryFn: async (
                {path, database, timeout}: {path: string; database: string; timeout?: number},
                {signal},
            ) => {
                try {
                    const data = await window.api.viewer.getDescribe(
                        {
                            path,
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
