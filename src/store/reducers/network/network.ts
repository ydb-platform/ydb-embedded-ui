import {api} from '../api';

export const networkApi = api.injectEndpoints({
    endpoints: (build) => ({
        getNetworkInfo: build.query({
            queryFn: async (
                {
                    database,
                    databaseFullPath,
                    useMetaProxy,
                }: {database: string; databaseFullPath: string; useMetaProxy?: boolean},
                {signal},
            ) => {
                try {
                    const data = await window.api.viewer.getNetwork(
                        {path: {path: databaseFullPath, databaseFullPath, useMetaProxy}, database},
                        {signal},
                    );
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
