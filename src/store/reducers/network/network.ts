import {api} from '../api';

export const networkApi = api.injectEndpoints({
    endpoints: (build) => ({
        getNetworkInfo: build.query({
            queryFn: async (tenant: string, {signal}) => {
                try {
                    const data = await window.api.viewer.getNetwork(
                        {path: tenant, database: tenant},
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
