import type {HotKey} from '../../../types/api/hotkeys';
import {api} from '../api';

export const hotKeysApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getHotKeys: builder.query<
            HotKey[] | null,
            {path: string; database: string; databaseFullPath: string; useMetaProxy?: boolean}
        >({
            queryFn: async ({path, database, databaseFullPath, useMetaProxy}, {signal}) => {
                try {
                    // Send request that will trigger hot keys sampling (enable_sampling = true)
                    const initialResponse = await window.api.viewer.getHotKeys(
                        {
                            path: {path, databaseFullPath, useMetaProxy},
                            database,
                            enableSampling: true,
                        },
                        {signal},
                    );

                    // If there are hotkeys in the initial request (hotkeys was collected before)
                    // we could just use colleted samples (collected hotkeys are stored only for 30 seconds)
                    if (Array.isArray(initialResponse.hotkeys)) {
                        return {data: initialResponse.hotkeys};
                    }

                    // Else wait for 5 seconds, while hot keys are being collected
                    await Promise.race([
                        new Promise((resolve) => {
                            setTimeout(resolve, 5000);
                        }),
                        new Promise((_, reject) => {
                            signal.addEventListener('abort', reject);
                        }),
                    ]);

                    // And request these samples (enable_sampling = false)
                    const response = await window.api.viewer.getHotKeys(
                        {
                            path: {path, databaseFullPath, useMetaProxy},
                            database,
                            enableSampling: false,
                        },
                        {signal},
                    );
                    return {data: response.hotkeys ?? null};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
