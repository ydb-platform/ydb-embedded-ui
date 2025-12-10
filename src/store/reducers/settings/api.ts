import type {
    GetSettingsParams,
    GetSingleSettingParams,
    SetSingleSettingParams,
} from '../../../types/api/settings';
import type {AppDispatch} from '../../defaultStore';
import {serializeError} from '../../utils';
import {api} from '../api';

import {SETTINGS_OPTIONS} from './constants';
import {parseSettingValue, stringifySettingValue} from './utils';

export const settingsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getSingleSetting: builder.query<unknown, Partial<GetSingleSettingParams>>({
            queryFn: async ({name, user}) => {
                try {
                    if (!name || !user || !window.api?.metaSettings) {
                        throw new Error(
                            'Cannot get setting, no MetaSettings API or necessary params are missing',
                        );
                    }

                    const data = await window.api.metaSettings.getSingleSetting({
                        name,
                        user,
                        // Directly access options here to avoid them in cache key
                        preventBatching: SETTINGS_OPTIONS[name]?.preventBatching,
                    });

                    return {data: parseSettingValue(data?.value)};
                } catch (error) {
                    return {error: serializeError(error)};
                }
            },
        }),
        setSingleSetting: builder.mutation({
            queryFn: async ({
                name,
                user,
                value,
            }: Omit<SetSingleSettingParams, 'value'> & {value: unknown}) => {
                try {
                    if (!window.api?.metaSettings) {
                        throw new Error('MetaSettings API is not available');
                    }

                    const data = await window.api.metaSettings.setSingleSetting({
                        name,
                        user,
                        value: stringifySettingValue(value),
                    });

                    if (data.status !== 'SUCCESS') {
                        throw new Error('Cannot set setting - status is not SUCCESS');
                    }

                    return {data};
                } catch (error) {
                    return {error: serializeError(error)};
                }
            },
            async onQueryStarted(args, {dispatch, queryFulfilled}) {
                const {name, user, value} = args;

                // Optimistically update existing cache entry
                const patchResult = dispatch(
                    settingsApi.util.updateQueryData('getSingleSetting', {name, user}, () => value),
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
        }),
        getSettings: builder.query({
            queryFn: async ({name, user}: Partial<GetSettingsParams>, baseApi) => {
                try {
                    if (!window.api?.metaSettings || !name || !user) {
                        throw new Error(
                            'Cannot get settings, no MetaSettings API or necessary params are missing',
                        );
                    }
                    const data = await window.api.metaSettings.getSettings({name, user});

                    const patches: Promise<unknown>[] = [];
                    const dispatch = baseApi.dispatch as AppDispatch;

                    // Upsert received data in getSingleSetting cache to prevent further redundant requests
                    name.forEach((settingName) => {
                        const settingData = data[settingName];

                        const cacheEntryParams: GetSingleSettingParams = {
                            name: settingName,
                            user,
                        };
                        const newSettingValue = parseSettingValue(settingData?.value);

                        const patch = dispatch(
                            settingsApi.util.upsertQueryData(
                                'getSingleSetting',
                                cacheEntryParams,
                                newSettingValue,
                            ),
                        );

                        patches.push(patch);
                    });

                    // Wait for all patches for proper loading state
                    await Promise.all(patches);

                    return {data};
                } catch (error) {
                    return {error: serializeError(error)};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});
