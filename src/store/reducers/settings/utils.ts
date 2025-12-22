import type {SettingValue} from '../../../types/api/settings';
import {parseJson} from '../../../utils/utils';

import type {SettingKey} from './constants';
import {DEFAULT_USER_SETTINGS, SETTINGS_OPTIONS} from './constants';

export function stringifySettingValue(value?: unknown): string {
    if (typeof value === 'string') {
        return value;
    }
    if (value === undefined) {
        return 'undefined';
    }
    return JSON.stringify(value);
}
export function parseSettingValue<T>(value?: SettingValue) {
    try {
        return (typeof value === 'string' ? parseJson(value) : value) as T;
    } catch {
        return undefined;
    }
}
export function readSettingValueFromLS<T = unknown>(name: string | undefined): T | undefined {
    if (!name) {
        return undefined;
    }

    try {
        const value = localStorage.getItem(name);

        return parseJson(value);
    } catch {
        return undefined;
    }
}
export function setSettingValueToLS(name: string | undefined, value: unknown): void {
    if (!name) {
        return;
    }

    try {
        const preparedValue = stringifySettingValue(value);
        localStorage.setItem(name, preparedValue);
    } catch {}
}
export function getSettingDefault(name: string) {
    return DEFAULT_USER_SETTINGS[name as SettingKey];
}

export function shouldSyncSettingToLS(name: string) {
    return !SETTINGS_OPTIONS[name]?.preventSyncWithLS;
}
