import type {
    GetSettingsParams,
    GetSingleSettingParams,
    SetSingleSettingParams,
    Setting,
} from '../../../types/api/settings';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {serializeReduxError} from '../../../utils/errors/serializeReduxError';
import type {AppDispatch} from '../../defaultStore';
import {api} from '../api';

import {SETTINGS_OPTIONS} from './constants';
import {handleOptimisticSettingWrite, handleRemoteSettingResult} from './effects';
import {shouldSyncSettingToLS, stringifySettingValue} from './utils';

async function delayMs(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function withRetries<T>(fn: () => Promise<T>, attempts: number, delay: number) {
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (attempt < attempts - 1) {
                await delayMs(delay);
            }
        }
    }
    throw lastError;
}

function resolveRemoteSettingsClientAndUser(user: string) {
    const userFromFactory = uiFactory.settingsBackend?.getUserId?.();
    const endpointFromFactory = uiFactory.settingsBackend?.getEndpoint?.();

    if (endpointFromFactory && userFromFactory && window.api?.settingsService) {
        return {client: window.api.settingsService, user: userFromFactory} as const;
    }

    if (window.api?.metaSettings) {
        return {client: window.api.metaSettings, user} as const;
    }

    return undefined;
}

export const settingsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getSingleSetting: builder.query<Setting | undefined, GetSingleSettingParams>({
            queryFn: async ({name, user}) => {
                try {
                    const resolved = resolveRemoteSettingsClientAndUser(user);
                    if (!resolved) {
                        throw new Error('MetaSettings API is not available');
                    }

                    const data = await resolved.client.getSingleSetting({
                        name,
                        user: resolved.user,
                        // Directly access options here to avoid them in cache key
                        preventBatching: SETTINGS_OPTIONS[name]?.preventBatching,
                    });

                    return {data};
                } catch (error) {
                    return {error: serializeReduxError(error)};
                }
            },
            async onQueryStarted(args, {dispatch, queryFulfilled}) {
                const {name, user} = args;
                if (!name) {
                    return;
                }

                try {
                    const {data} = await queryFulfilled;

                    handleRemoteSettingResult({
                        user: resolveRemoteSettingsClientAndUser(user)?.user ?? user,
                        name,
                        remoteValue: data?.value,
                        dispatch,
                        migrateToRemote: (params) => {
                            dispatch(settingsApi.endpoints.setSingleSetting.initiate(params));
                        },
                    });
                } catch {
                    // ignore
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
                    const resolved = resolveRemoteSettingsClientAndUser(user);
                    if (!resolved) {
                        throw new Error('MetaSettings API is not available');
                    }

                    const data = await withRetries(
                        () =>
                            resolved.client.setSingleSetting({
                                name,
                                user: resolved.user,
                                value: stringifySettingValue(value),
                            }),
                        3,
                        200,
                    );

                    if (data.status !== 'SUCCESS') {
                        throw new Error('Cannot set setting - status is not SUCCESS');
                    }

                    return {data};
                } catch (error) {
                    return {error: serializeReduxError(error)};
                }
            },
            async onQueryStarted(args, {dispatch, queryFulfilled}) {
                const {name, value} = args;
                const shouldSyncToLS = shouldSyncSettingToLS(name);

                await handleOptimisticSettingWrite({
                    name,
                    value,
                    dispatch,
                    metaSettingsAvailable: Boolean(
                        window.api?.metaSettings || window.api?.settingsService,
                    ),
                    shouldSyncToLS,
                    awaitRemote: queryFulfilled,
                });
            },
        }),
        getSettings: builder.query<Record<string, Setting>, GetSettingsParams>({
            queryFn: async ({name, user}: GetSettingsParams, baseApi) => {
                try {
                    const resolved = resolveRemoteSettingsClientAndUser(user);
                    if (!resolved) {
                        throw new Error('MetaSettings API is not available');
                    }
                    const data = await resolved.client.getSettings({name, user: resolved.user});

                    const patches: Promise<unknown>[] = [];
                    const dispatch = baseApi.dispatch as AppDispatch;

                    // Upsert received data in getSingleSetting cache to prevent further redundant requests
                    name.forEach((settingName) => {
                        const settingData = data[settingName];

                        const cacheEntryParams: GetSingleSettingParams = {
                            name: settingName,
                            user: resolved.user,
                        };
                        const remoteValue = settingData?.value;

                        const patch = dispatch(
                            settingsApi.util.upsertQueryData(
                                'getSingleSetting',
                                cacheEntryParams,
                                settingData,
                            ),
                        );

                        patches.push(patch);

                        handleRemoteSettingResult({
                            user: resolved.user,
                            name: settingName,
                            remoteValue,
                            dispatch,
                            migrateToRemote: (params) => {
                                dispatch(settingsApi.endpoints.setSingleSetting.initiate(params));
                            },
                        });
                    });

                    // Wait for all patches for proper loading state
                    await Promise.all(patches);

                    return {data};
                } catch (error) {
                    return {error: serializeReduxError(error)};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});
