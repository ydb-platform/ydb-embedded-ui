import type {SettingValue} from '../../../types/api/settings';
import {parseJson} from '../../../utils/utils';

export function stringifySettingValue<T>(value?: T): string {
    return typeof value === 'string' ? value : JSON.stringify(value);
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
