import {isNil} from 'lodash';

import type {
    GetSingleSettingParams,
    SetSettingResponse,
    SetSingleSettingParams,
    SettingValue,
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
    client: {
        getSingleSetting: (
            params: GetSingleSettingParams & {preventBatching?: boolean},
        ) => Promise<SettingValue | undefined>;
        setSingleSetting: (params: SetSingleSettingParams) => Promise<SetSettingResponse>;
    };
};

function getLocalStorageRemoteSnapshotKey() {
    const hostname = typeof window === 'undefined' ? undefined : window.location?.hostname;
    const safeHostname = hostname || 'unknown';
    return `${LOCAL_STORAGE_REMOTE_SNAPSHOT_PREFIX}${safeHostname}`;
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
    if (isNil(remoteValue)) {
        return false;
    }

    const existingLocalString = tryReadLocalStorageString(name);
    return existingLocalString !== null && existingLocalString !== remoteValue;
}

export async function snapshotLocalStorageToRemoteOnce(
    resolved: ResolvedRemoteSettingsForSnapshot,
) {
    const snapshotKey = getLocalStorageRemoteSnapshotKey();
    const inFlightKey = snapshotKey;

    const inFlight = inFlightSnapshots.get(inFlightKey);
    if (inFlight) {
        await inFlight;
        return;
    }

    const runSnapshotAttempt = async () => {
        try {
            const existingSnapshot = await resolved.client.getSingleSetting({
                name: snapshotKey,
                preventBatching: true,
            });
            // Axios returns `response.data === ''` for HTTP 204 (No Content).
            // Treat empty string as "missing snapshot" so we can create the backup.
            if (!isNil(existingSnapshot) && existingSnapshot !== '') {
                return;
            }
        } catch {
            return;
        }

        try {
            const payload = buildLocalStorageSnapshotPayload();
            const snapshotResponse = await resolved.client.setSingleSetting({
                name: snapshotKey,
                value: stringifySettingValue(payload),
            });

            const snapshotStatus = snapshotResponse?.status;
            if (snapshotStatus && snapshotStatus !== 'SUCCESS') {
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
