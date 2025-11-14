import {isNil} from 'lodash';

import type {
    GetSettingsParams,
    GetSingleSettingParams,
    SetSingleSettingParams,
    Setting,
} from '../../../types/api/settings';
import type {AppDispatch} from '../../defaultStore';
import {api} from '../api';

import {SETTINGS_OPTIONS} from './constants';

export const settingsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getSingleSetting: builder.query({
            queryFn: async ({name, user}: GetSingleSettingParams, baseApi) => {
                try {
                    if (!window.api.metaSettings) {
                        throw new Error('MetaSettings API is not available');
                    }
                    const data = await window.api.metaSettings.getSingleSetting({
                        name,
                        user,
                        // Directly access options here to avoid them in cache key
                        preventBatching: SETTINGS_OPTIONS[name]?.preventBatching,
                    });

                    const dispatch = baseApi.dispatch as AppDispatch;

                    // Try to sync local value if there is no backend value
                    syncLocalValueToMetaIfNoData(data, dispatch);

                    return {data};
                } catch (error) {
                    return {error};
                }
            },
        }),
        setSingleSetting: builder.mutation({
            queryFn: async (params: SetSingleSettingParams) => {
                try {
                    if (!window.api.metaSettings) {
                        throw new Error('MetaSettings API is not available');
                    }

                    const data = await window.api.metaSettings.setSingleSetting(params);

                    if (data.status !== 'SUCCESS') {
                        throw new Error('Setting status is not SUCCESS');
                    }

                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            async onQueryStarted(args, {dispatch, queryFulfilled}) {
                const {name, user, value} = args;

                // Optimistically update existing cache entry
                const patchResult = dispatch(
                    settingsApi.util.updateQueryData('getSingleSetting', {name, user}, (draft) => {
                        return {...draft, name, user, value};
                    }),
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
        }),
        getSettings: builder.query({
            queryFn: async ({name, user}: GetSettingsParams, baseApi) => {
                try {
                    if (!window.api.metaSettings) {
                        throw new Error('MetaSettings API is not available');
                    }
                    const data = await window.api.metaSettings.getSettings({name, user});

                    const patches: Promise<void>[] = [];
                    const dispatch = baseApi.dispatch as AppDispatch;

                    // Upsert received data in getSingleSetting cache
                    name.forEach((settingName) => {
                        const settingData = data[settingName] ?? {};

                        const cacheEntryParams: GetSingleSettingParams = {
                            name: settingName,
                            user,
                        };
                        const newValue = {name: settingName, user, value: settingData?.value};

                        const patch = dispatch(
                            settingsApi.util.upsertQueryData(
                                'getSingleSetting',
                                cacheEntryParams,
                                newValue,
                            ),
                        ).then(() => {
                            // Try to sync local value if there is no backend value
                            // Do it after upsert if finished to ensure proper values update order
                            // 1. New entry added to cache with nil value
                            // 2. Positive entry update - local storage value replace nil in cache
                            // 3.1. Set is successful, local value in cache
                            // 3.2. Set is not successful, cache value reverted to previous nil
                            syncLocalValueToMetaIfNoData(settingData, dispatch);
                        });

                        patches.push(patch);
                    });

                    // Wait for all patches for proper loading state
                    await Promise.all(patches);

                    return {data};
                } catch (error) {
                    return {error};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});

function syncLocalValueToMetaIfNoData(params: Setting, dispatch: AppDispatch) {
    const localValue = localStorage.getItem(params.name);

    if (isNil(params.value) && !isNil(localValue)) {
        dispatch(
            settingsApi.endpoints.setSingleSetting.initiate({
                name: params.name,
                user: params.user,
                value: localValue,
            }),
        );
    }
}
