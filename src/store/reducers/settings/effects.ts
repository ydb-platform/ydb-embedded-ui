import {isNil} from 'lodash';

import type {SettingValue} from '../../../types/api/settings';

import {setSettingValueInStore} from './settings';
import {
    parseSettingValue,
    readSettingValueFromLS,
    setSettingValueToLS,
    shouldSyncSettingToLS,
} from './utils';

export type MigrateToRemoteFn = (args: {user: string; name: string; value: unknown}) => void;

export function handleRemoteSettingResult(args: {
    user: string;
    name: string;
    remoteValue: SettingValue | undefined;
    dispatch: (action: unknown) => void;
    migrateToRemote: MigrateToRemoteFn;
}) {
    const {user, name, remoteValue, dispatch, migrateToRemote} = args;

    const shouldUseLS = shouldSyncSettingToLS(name);

    if (isNil(remoteValue)) {
        if (!shouldUseLS) {
            return;
        }
        const localValue = readSettingValueFromLS(name);
        if (!isNil(localValue)) {
            migrateToRemote({user, name, value: localValue});
        }
        return;
    }

    const parsedValue = parseSettingValue(remoteValue);
    dispatch(setSettingValueInStore({name, value: parsedValue}));

    if (shouldUseLS) {
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
