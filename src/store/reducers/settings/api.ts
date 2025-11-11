import type {Action, ThunkAction} from '@reduxjs/toolkit';

import type {
    GetSettingsParams,
    GetSingleSettingParams,
    SetSingleSettingParams,
} from '../../../types/api/settings';
import type {RootState} from '../../defaultStore';
import {api} from '../api';

import {SETTINGS_OPTIONS} from './constants';

export const settingsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getSingleSetting: builder.query({
            queryFn: async ({name, user}: GetSingleSettingParams) => {
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
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: (_, __, args) => [{type: 'UserData', id: `Setting_${args.name}`}],
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
            queryFn: async ({name, user}: GetSettingsParams, {dispatch}) => {
                try {
                    if (!window.api.metaSettings) {
                        throw new Error('MetaSettings API is not available');
                    }
                    const data = await window.api.metaSettings.getSettings({name, user});

                    const patches: ThunkAction<unknown, RootState, unknown, Action>[] = [];

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
                        );

                        patches.push(patch);
                    });

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
