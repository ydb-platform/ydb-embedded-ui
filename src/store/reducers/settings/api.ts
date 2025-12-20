import type {
    GetSettingsParams,
    GetSingleSettingParams,
    SetSettingResponse,
    SetSingleSettingParams,
    SettingValue,
} from '../../../types/api/settings';
import {serializeReduxError} from '../../../utils/errors/serializeReduxError';
import type {AppDispatch} from '../../defaultStore';
import {api} from '../api';

import {
    shouldSnapshotBeforeOverwriteLocalStorage,
    snapshotLocalStorageToRemoteOnce,
} from './RemoteLocalStorageSnapshot';
import {SETTINGS_OPTIONS} from './constants';
import {
    applyRemoteSettingToStoreAndLocalStorage,
    getLocalStorageValueToMigrateIfRemoteMissing,
    handleOptimisticSettingWrite,
} from './effects';
import {shouldSyncSettingToLS, stringifySettingValue} from './utils';

const REMOTE_WRITE_DEBOUNCE_MS = 200;
const REMOTE_WRITE_IN_FLIGHT_TIMEOUT_MS = 10_000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
            reject(new Error('Remote settings write timed out'));
        }, ms);

        promise
            .then((value) => {
                clearTimeout(timeoutId);
                resolve(value);
            })
            .catch((error) => {
                clearTimeout(timeoutId);
                reject(error);
            });
    });
}

type DebounceEntry<T> = {
    timeoutId: number | undefined;
    latestRequest: () => Promise<T>;
    pending: Array<{resolve: (value: T) => void; reject: (error: unknown) => void}>;
    inFlight: boolean;
};

const debouncedRemoteWrites = new Map<string, DebounceEntry<unknown>>();
const inFlightLocalStorageMigrations = new Map<string, Promise<void>>();

function triggerFlushDebouncedRemoteWrite(key: string) {
    // Fire-and-forget: concurrency is serialized by `entry.inFlight`.
    flushDebouncedRemoteWrite(key).catch(() => {
        // best-effort
    });
}

async function flushDebouncedRemoteWrite(key: string) {
    const entry = debouncedRemoteWrites.get(key);
    if (!entry || entry.inFlight) {
        return;
    }

    entry.inFlight = true;
    entry.timeoutId = undefined;

    const pending = entry.pending;
    entry.pending = [];

    try {
        const result = await withTimeout(entry.latestRequest(), REMOTE_WRITE_IN_FLIGHT_TIMEOUT_MS);
        pending.forEach((p) => p.resolve(result));
    } catch (error) {
        pending.forEach((p) => p.reject(error));
    } finally {
        entry.inFlight = false;

        if (entry.pending.length > 0) {
            entry.timeoutId = window.setTimeout(() => {
                triggerFlushDebouncedRemoteWrite(key);
            }, REMOTE_WRITE_DEBOUNCE_MS);
        } else {
            debouncedRemoteWrites.delete(key);
        }
    }
}

function scheduleDebouncedRemoteWrite<T>(key: string, request: () => Promise<T>) {
    const existing = debouncedRemoteWrites.get(key) as DebounceEntry<T> | undefined;
    if (existing) {
        if (existing.timeoutId !== undefined) {
            clearTimeout(existing.timeoutId);
        }
        existing.latestRequest = request;
        return new Promise<T>((resolve, reject) => {
            existing.pending.push({resolve, reject});
            if (!existing.inFlight) {
                existing.timeoutId = window.setTimeout(() => {
                    triggerFlushDebouncedRemoteWrite(key);
                }, REMOTE_WRITE_DEBOUNCE_MS);
            }
        });
    }

    return new Promise<T>((resolve, reject) => {
        const entry: DebounceEntry<T> = {
            timeoutId: undefined,
            latestRequest: request,
            pending: [{resolve, reject}],
            inFlight: false,
        };
        debouncedRemoteWrites.set(key, entry as DebounceEntry<unknown>);
        entry.timeoutId = window.setTimeout(() => {
            triggerFlushDebouncedRemoteWrite(key);
        }, REMOTE_WRITE_DEBOUNCE_MS);
    });
}

function resolveRemoteSettingsClientAndUser(user: string | undefined) {
    if (window.api?.metaSettings) {
        return {client: window.api.metaSettings, user} as const;
    }

    return undefined;
}

function scheduleLocalStorageMigrationToRemoteIfMissing(args: {
    resolved: {
        client: {setSingleSetting: (params: SetSingleSettingParams) => Promise<SetSettingResponse>};
        user: string | undefined;
    };
    name: string;
    valueToMigrate: unknown;
}) {
    const {resolved, name, valueToMigrate} = args;
    const inFlightKey = name;

    const existing = inFlightLocalStorageMigrations.get(inFlightKey);
    if (existing) {
        return existing;
    }

    const promise = (async () => {
        try {
            const data = await resolved.client.setSingleSetting({
                user: resolved.user,
                name,
                value: stringifySettingValue(valueToMigrate),
            });

            const status = data?.status;
            if (status && status !== 'SUCCESS') {
                throw new Error('Cannot migrate setting - status is not SUCCESS');
            }
        } catch {
            // best-effort
        }
    })();

    inFlightLocalStorageMigrations.set(inFlightKey, promise);
    promise.finally(() => {
        inFlightLocalStorageMigrations.delete(inFlightKey);
    });

    return promise;
}

export const settingsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getSingleSetting: builder.query<SettingValue | undefined, GetSingleSettingParams>({
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
                    const resolved = resolveRemoteSettingsClientAndUser(user);
                    const remoteValue = data;

                    const shouldSnapshotBeforeOverwrite =
                        Boolean(resolved) &&
                        shouldSnapshotBeforeOverwriteLocalStorage({name, remoteValue});

                    if (resolved && shouldSnapshotBeforeOverwrite) {
                        await snapshotLocalStorageToRemoteOnce(resolved);
                    }

                    const valueToMigrate = getLocalStorageValueToMigrateIfRemoteMissing({
                        name,
                        remoteValue,
                    });
                    if (resolved && valueToMigrate !== undefined) {
                        scheduleLocalStorageMigrationToRemoteIfMissing({
                            resolved,
                            name,
                            valueToMigrate,
                        }).catch(() => {
                            // best-effort
                        });
                    }
                    applyRemoteSettingToStoreAndLocalStorage({name, remoteValue, dispatch});
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

                    const debounceKey = name;

                    const data = await scheduleDebouncedRemoteWrite<SetSettingResponse>(
                        debounceKey,
                        () =>
                            resolved.client.setSingleSetting({
                                name,
                                user: resolved.user,
                                value: stringifySettingValue(value),
                            }),
                    );

                    const status = data?.status;

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
                    metaSettingsAvailable: Boolean(window.api?.metaSettings),
                    shouldSyncToLS,
                    awaitRemote: queryFulfilled,
                });
            },
        }),
        getSettings: builder.query<Record<string, SettingValue | undefined>, GetSettingsParams>({
            queryFn: async ({name, user}: GetSettingsParams, baseApi) => {
                try {
                    const resolved = resolveRemoteSettingsClientAndUser(user);
                    if (!resolved) {
                        throw new Error('MetaSettings API is not available');
                    }
                    const data = await resolved.client.getSettings({name, user: resolved.user});

                    const shouldSnapshotBeforeOverwrite = name.some((settingName) => {
                        const remoteValue = data[settingName];
                        return shouldSnapshotBeforeOverwriteLocalStorage({
                            name: settingName,
                            remoteValue,
                        });
                    });
                    if (shouldSnapshotBeforeOverwrite) {
                        await snapshotLocalStorageToRemoteOnce(resolved);
                    }

                    const patches: Promise<unknown>[] = [];
                    const dispatch = baseApi.dispatch as AppDispatch;

                    // Upsert received data in getSingleSetting cache to prevent further redundant requests
                    name.forEach((settingName) => {
                        const settingData = data[settingName];

                        const cacheEntryParams: GetSingleSettingParams = resolved.user
                            ? {name: settingName, user: resolved.user}
                            : {name: settingName};
                        const remoteValue = settingData;

                        const patch = dispatch(
                            settingsApi.util.upsertQueryData(
                                'getSingleSetting',
                                cacheEntryParams,
                                settingData,
                            ),
                        );

                        patches.push(patch);

                        const valueToMigrate = getLocalStorageValueToMigrateIfRemoteMissing({
                            name: settingName,
                            remoteValue,
                        });
                        if (valueToMigrate !== undefined) {
                            scheduleLocalStorageMigrationToRemoteIfMissing({
                                resolved,
                                name: settingName,
                                valueToMigrate,
                            }).catch(() => {
                                // best-effort
                            });
                        }
                        applyRemoteSettingToStoreAndLocalStorage({
                            name: settingName,
                            remoteValue,
                            dispatch,
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
