import type {
    GetSingleSettingParams,
    SetSettingResponse,
    SetSingleSettingParams,
    Setting,
} from '../../../types/api/settings';
import {
    DEFAULT_CLUSTER_TAB_KEY,
    DEFAULT_IS_QUERY_RESULT_COLLAPSED,
    DEFAULT_IS_TENANT_COMMON_INFO_COLLAPSED,
    DEFAULT_IS_TENANT_SUMMARY_COLLAPSED,
    DEFAULT_SIZE_RESULT_PANE_KEY,
    DEFAULT_SIZE_TENANT_KEY,
    DEFAULT_SIZE_TENANT_SUMMARY_KEY,
} from '../../../utils/constants';

import {DEFAULT_USER_SETTINGS} from './constants';
import {shouldSyncSettingToLS, stringifySettingValue} from './utils';

const DRAWER_WIDTH_KEY = 'drawer-width';
const LOCAL_STORAGE_REMOTE_SNAPSHOT_PREFIX = 'all-local-storage-';
const LOCAL_STORAGE_REMOTE_SNAPSHOT_ATTEMPTED_PREFIX = 'all-local-storage-attempted-';

const LOCAL_STORAGE_SETTINGS_KEYS_FOR_SNAPSHOT = Array.from(
    new Set<string>([
        ...Object.keys(DEFAULT_USER_SETTINGS),
        DEFAULT_CLUSTER_TAB_KEY,
        DEFAULT_SIZE_RESULT_PANE_KEY,
        DEFAULT_SIZE_TENANT_SUMMARY_KEY,
        DEFAULT_SIZE_TENANT_KEY,
        DEFAULT_IS_TENANT_SUMMARY_COLLAPSED,
        DEFAULT_IS_TENANT_COMMON_INFO_COLLAPSED,
        DEFAULT_IS_QUERY_RESULT_COLLAPSED,
        DRAWER_WIDTH_KEY,
    ]),
);

const inFlightSnapshots = new Map<string, Promise<void>>();

export type ResolvedRemoteSettingsForSnapshot = {
    clientKey: string;
    user: string;
    client: {
        getSingleSetting: (
            params: GetSingleSettingParams & {preventBatching?: boolean},
        ) => Promise<Setting | undefined>;
        setSingleSetting: (params: SetSingleSettingParams) => Promise<SetSettingResponse>;
    };
};

function getLocalStorageRemoteSnapshotKey() {
    const hostname = typeof window === 'undefined' ? undefined : window.location?.hostname;
    const safeHostname = hostname || 'unknown';
    return `${LOCAL_STORAGE_REMOTE_SNAPSHOT_PREFIX}${safeHostname}`;
}

function getLocalStorageRemoteSnapshotAttemptedKey() {
    const hostname = typeof window === 'undefined' ? undefined : window.location?.hostname;
    const safeHostname = hostname || 'unknown';
    return `${LOCAL_STORAGE_REMOTE_SNAPSHOT_ATTEMPTED_PREFIX}${safeHostname}`;
}

function tryReadLocalStorageString(key: string) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function buildLocalStorageSnapshotPayload() {
    const snapshot: Record<string, string> = {};
    for (const key of LOCAL_STORAGE_SETTINGS_KEYS_FOR_SNAPSHOT) {
        const value = tryReadLocalStorageString(key);
        if (value !== null) {
            snapshot[key] = value;
        }
    }
    return snapshot;
}

export function shouldSnapshotBeforeOverwriteLocalStorage(args: {
    name: string;
    remoteValue: string | undefined;
}) {
    const {name, remoteValue} = args;
    if (!shouldSyncSettingToLS(name)) {
        return false;
    }
    if (remoteValue === undefined || remoteValue === null) {
        return false;
    }

    const existingLocalString = tryReadLocalStorageString(name);
    return existingLocalString !== null && existingLocalString !== remoteValue;
}

export async function snapshotLocalStorageToRemoteOnce(
    resolved: ResolvedRemoteSettingsForSnapshot,
) {
    const snapshotKey = getLocalStorageRemoteSnapshotKey();
    const attemptedKey = getLocalStorageRemoteSnapshotAttemptedKey();
    const inFlightKey = `${resolved.clientKey}:${resolved.user}:${snapshotKey}`;

    const inFlight = inFlightSnapshots.get(inFlightKey);
    if (inFlight) {
        await inFlight;
        return;
    }

    const runSnapshotAttempt = async () => {
        try {
            const existingSnapshot = await resolved.client.getSingleSetting({
                name: snapshotKey,
                user: resolved.user,
                preventBatching: true,
            });
            if (existingSnapshot?.value !== undefined && existingSnapshot?.value !== null) {
                return;
            }

            const existingAttempted = await resolved.client.getSingleSetting({
                name: attemptedKey,
                user: resolved.user,
                preventBatching: true,
            });
            if (existingAttempted?.value !== undefined && existingAttempted?.value !== null) {
                return;
            }
        } catch {
            return;
        }

        try {
            const payload = buildLocalStorageSnapshotPayload();
            const snapshotResponse = await resolved.client.setSingleSetting({
                name: snapshotKey,
                user: resolved.user,
                value: stringifySettingValue(payload),
            });

            const snapshotStatus = snapshotResponse?.status;
            if (snapshotStatus && snapshotStatus !== 'SUCCESS') {
                return;
            }

            // Mark "attempted" only after a successful snapshot write.
            const attemptedResponse = await resolved.client.setSingleSetting({
                name: attemptedKey,
                user: resolved.user,
                value: stringifySettingValue(true),
            });
            const attemptedStatus = attemptedResponse?.status;
            if (attemptedStatus && attemptedStatus !== 'SUCCESS') {
                return;
            }
        } catch {
            // best-effort
        }
    };

    const promise = runSnapshotAttempt();

    inFlightSnapshots.set(inFlightKey, promise);
    try {
        await promise;
    } finally {
        inFlightSnapshots.delete(inFlightKey);
    }
}
