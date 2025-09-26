import {api} from './api';

export const configsApi = api.injectEndpoints({
    endpoints: (build) => ({
        getFeatureFlags: build.query({
            queryFn: async ({database}: {database?: string}, {signal}) => {
                try {
                    const res = await window.api.viewer.getFeatureFlags(database, {signal});
                    const db = res.Databases[0];

                    return {data: db.FeatureFlags};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
        getConfig: build.query({
            queryFn: async ({database}: {database?: string}, {signal}) => {
                try {
                    const res = await window.api.viewer.getConfig(database, {signal});

                    const {StartupConfigYaml, ...rest} = res;

                    return {data: {current: rest, startup: String(StartupConfigYaml)}};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
