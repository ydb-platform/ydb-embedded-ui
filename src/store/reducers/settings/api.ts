import type {
    GetSettingsParams,
    GetSingleSettingParams,
    SetSettingResponse,
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

const REMOTE_WRITE_DEBOUNCE_MS = 200;

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

type DebounceEntry<T> = {
    timeoutId: number;
    latestRequest: () => Promise<T>;
    pending: Array<{resolve: (value: T) => void; reject: (error: unknown) => void}>;
};

const debouncedRemoteWrites = new Map<string, DebounceEntry<unknown>>();

function scheduleDebouncedRemoteWrite<T>(key: string, request: () => Promise<T>) {
    const existing = debouncedRemoteWrites.get(key) as DebounceEntry<T> | undefined;
    if (existing) {
        clearTimeout(existing.timeoutId);
        existing.latestRequest = request;
        return new Promise<T>((resolve, reject) => {
            existing.pending.push({resolve, reject});
            existing.timeoutId = window.setTimeout(async () => {
                const entry = debouncedRemoteWrites.get(key) as DebounceEntry<T> | undefined;
                if (!entry) {
                    return;
                }
                debouncedRemoteWrites.delete(key);
                try {
                    const result = await entry.latestRequest();
                    entry.pending.forEach((p) => p.resolve(result));
                } catch (error) {
                    entry.pending.forEach((p) => p.reject(error));
                }
            }, REMOTE_WRITE_DEBOUNCE_MS);
        });
    }

    return new Promise<T>((resolve, reject) => {
        const entry: DebounceEntry<T> = {
            timeoutId: window.setTimeout(async () => {
                const current = debouncedRemoteWrites.get(key) as DebounceEntry<T> | undefined;
                if (!current) {
                    return;
                }
                debouncedRemoteWrites.delete(key);
                try {
                    const result = await current.latestRequest();
                    current.pending.forEach((p) => p.resolve(result));
                } catch (error) {
                    current.pending.forEach((p) => p.reject(error));
                }
            }, REMOTE_WRITE_DEBOUNCE_MS),
            latestRequest: request,
            pending: [{resolve, reject}],
        };
        debouncedRemoteWrites.set(key, entry as DebounceEntry<unknown>);
    });
}

function resolveRemoteSettingsClientAndUser(user: string) {
    const userFromFactory = uiFactory.settingsBackend?.getUserId?.();
    const endpointFromFactory = uiFactory.settingsBackend?.getEndpoint?.();

    if (endpointFromFactory && userFromFactory && window.api?.settingsService) {
        return {
            client: window.api.settingsService,
            user: userFromFactory,
            clientKey: 'service',
        } as const;
    }

    if (window.api?.metaSettings) {
        return {client: window.api.metaSettings, user, clientKey: 'meta'} as const;
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

                    const debounceKey = `${resolved.clientKey}:${resolved.user}:${name}`;

                    const data = await scheduleDebouncedRemoteWrite<SetSettingResponse>(
                        debounceKey,
                        () =>
                            withRetries(
                                () =>
                                    resolved.client.setSingleSetting({
                                        name,
                                        user: resolved.user,
                                        value: stringifySettingValue(value),
                                    }),
                                3,
                                200,
                            ),
                    );

                    const status =
                        data && typeof data === 'object' && 'status' in data
                            ? (data as {status?: string}).status
                            : undefined;

                    if (status && status !== 'SUCCESS') {
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
