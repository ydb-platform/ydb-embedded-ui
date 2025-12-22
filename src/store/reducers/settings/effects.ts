import {isNil} from 'lodash';

import type {SettingValue} from '../../../types/api/settings';

import {setSettingValueInStore} from './settings';
import {
    parseSettingValue,
    readSettingValueFromLS,
    setSettingValueToLS,
    shouldSyncSettingToLS,
} from './utils';

export function getLocalStorageValueToMigrateIfRemoteMissing(args: {
    name: string;
    remoteValue: SettingValue | undefined;
}) {
    const {name, remoteValue} = args;

    if (!shouldSyncSettingToLS(name)) {
        return undefined;
    }

    if (!isNil(remoteValue)) {
        return undefined;
    }

    const localValue = readSettingValueFromLS(name);
    return isNil(localValue) ? undefined : localValue;
}

export function applyRemoteSettingToStoreAndLocalStorage(args: {
    name: string;
    remoteValue: SettingValue | undefined;
    dispatch: (action: unknown) => void;
}) {
    const {name, remoteValue, dispatch} = args;

    if (isNil(remoteValue)) {
        return;
    }

    const parsedValue = parseSettingValue(remoteValue);
    dispatch(setSettingValueInStore({name, value: parsedValue}));

    if (shouldSyncSettingToLS(name)) {
        setSettingValueToLS(name, parsedValue);
    }
}

export async function handleOptimisticSettingWrite(args: {
    name: string;
    value: unknown;
    dispatch: (action: unknown) => void;
    metaSettingsAvailable: boolean;
    shouldSyncToLS: boolean;
    awaitRemote: Promise<unknown>;
}) {
    const {name, value, dispatch, metaSettingsAvailable, shouldSyncToLS, awaitRemote} = args;

    dispatch(setSettingValueInStore({name, value}));

    if (shouldSyncToLS) {
        setSettingValueToLS(name, value);
    }

    if (!metaSettingsAvailable) {
        return;
    }

    try {
        await awaitRemote;
    } catch {
        // keep local state; remote write is best-effort
    }
}
