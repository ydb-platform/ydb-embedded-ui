import {getValueFromLS} from './utils';

export const userSettings = window.userSettings || {};
export const systemSettings = window.systemSettings || {};

export function readSavedSettingsValue(key: string, defaultValue?: string) {
    const savedValue = window.web_version ? userSettings[key] : getValueFromLS(key);

    return savedValue ?? defaultValue;
}
