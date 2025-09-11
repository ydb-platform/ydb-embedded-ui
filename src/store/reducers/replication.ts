import {api} from './api';

export const replicationApi = api.injectEndpoints({
    endpoints: (build) => ({
        getReplication: build.query({
            queryFn: async ({
                path,
                database,
                databaseFullPath,
            }: {
                path: string;
                database: string;
                databaseFullPath: string;
            }) => {
                try {
                    const data = await window.api.viewer.getReplication({
                        path: {path, databaseFullPath},
                        database,
                    });
                    // On older version it can return HTML page of Developer UI with an error
                    if (typeof data !== 'object') {
                        return {error: {}};
                    }
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
