import {isNil} from 'lodash';

import type {
    GetSettingsParams,
    GetSingleSettingParams,
    SetSingleSettingParams,
    Setting,
} from '../../../types/api/settings';
import type {AppDispatch, RootState} from '../../defaultStore';
import {api} from '../api';

import {SETTINGS_OPTIONS} from './constants';
import {getSettingValue, setSettingValue} from './settings';
import {
    getSettingDefault,
    parseSettingValue,
    readSettingValueFromLS,
    setSettingValueToLS,
    shouldSyncSettingToLS,
    stringifySettingValue,
} from './utils';

const invalidParamsError =
    'Missing required parameters (name, user) or MetaSettings API is not available';

export const settingsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getSingleSetting: builder.query<Setting | undefined, Partial<GetSingleSettingParams>>({
            queryFn: async ({name, user}) => {
                try {
                    // In this case localStorage should be used for settings
                    // Actual value will be loaded to store in onQueryStarted
                    if (!name || !user || !window.api.metaSettings) {
                        throw new Error(invalidParamsError);
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
            async onQueryStarted(args, {dispatch, queryFulfilled}) {
                const {name, user} = args;

                if (!name) {
                    return;
                }

                const shouldUseLocalSettings =
                    !user || !window.api.metaSettings || shouldSyncSettingToLS(name);

                const defaultValue = getSettingDefault(name);

                // Preload value from LS or default to store
                if (shouldUseLocalSettings) {
                    const savedValue = readSettingValueFromLS(name);
                    const value = savedValue ?? defaultValue;

                    dispatch(setSettingValue(name, value));
                } else {
                    dispatch(setSettingValue(name, defaultValue));
                }

                try {
                    const {data} = await queryFulfilled;

                    // Load api value to store if present
                    // In case local storage should be used
                    // query will finish with an error and this code will not run
                    const parsedValue = parseSettingValue(data?.value);

                    if (isNil(data?.value)) {
                        // Try to sync local value if there is no backend value
                        syncLocalValueToMetaIfNoData({...data}, dispatch);
                    } else {
                        dispatch(setSettingValue(name, parsedValue));

                        if (shouldSyncSettingToLS(name)) {
                            setSettingValueToLS(name, data.value);
                        }
                    }
                } catch {}
            },
        }),
        setSingleSetting: builder.mutation({
            queryFn: async ({
                name,
                user,
                value,
            }: Partial<Omit<SetSingleSettingParams, 'value'>> & {value: unknown}) => {
                try {
                    if (!name || !user || !window.api.metaSettings) {
                        throw new Error(invalidParamsError);
                    }

                    const data = await window.api.metaSettings.setSingleSetting({
                        name,
                        user,
                        value: stringifySettingValue(value),
                    });

                    if (data.status !== 'SUCCESS') {
                        throw new Error('Setting status is not SUCCESS');
                    }

                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            async onQueryStarted(args, {dispatch, queryFulfilled, getState}) {
                const {name, user, value} = args;

                if (!name) {
                    return;
                }

                // Extract previous value to revert to it if set is not succesfull
                const previousSettingValue = getSettingValue(getState() as RootState, name);

                // Optimistically update store
                dispatch(setSettingValue(name, value));

                // If local storage settings should be used
                // Update LS and do not do any further code
                if (!user || !window.api.metaSettings) {
                    setSettingValueToLS(name, value);
                    return;
                }

                try {
                    await queryFulfilled;

                    // If mutation is successful, we can store new value in LS
                    if (shouldSyncSettingToLS(name)) {
                        setSettingValueToLS(name, value);
                    }
                } catch {
                    // Set previous value to store in case of error
                    dispatch(setSettingValue(name, previousSettingValue));
                }
            },
        }),
        getSettings: builder.query({
            queryFn: async ({name, user}: Partial<GetSettingsParams>, baseApi) => {
                try {
                    if (!window.api.metaSettings || !name || !user) {
                        throw new Error(invalidParamsError);
                    }
                    const data = await window.api.metaSettings.getSettings({name, user});

                    const patches: Promise<unknown>[] = [];
                    const dispatch = baseApi.dispatch as AppDispatch;

                    // Upsert received data in getSingleSetting cache to prevent further redundant requests
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
                        if (isNil(settingData.value)) {
                            // Try to sync local value if there is no backend value
                            syncLocalValueToMetaIfNoData(settingData, dispatch);
                        } else {
                            const parsedValue = parseSettingValue(settingData.value);
                            dispatch(setSettingValue(settingName, parsedValue));

                            if (shouldSyncSettingToLS(settingName)) {
                                setSettingValueToLS(settingName, settingData.value);
                            }
                        }

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

function syncLocalValueToMetaIfNoData(params: Partial<Setting>, dispatch: AppDispatch) {
    if (!params.name) {
        return;
    }

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
