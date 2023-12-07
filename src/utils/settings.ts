import {getValueFromLS} from './utils';

export const userSettings = window.userSettings || {};
export const systemSettings = window.systemSettings || {};

export const settingsApi = window.web_version ? systemSettings.settingsApi : undefined;

export function readSavedSettingsValue(key: string, defaultValue?: string) {
    // If there is no settingsApi, use localStorage
    const savedValue = settingsApi ? userSettings[key] : getValueFromLS(key);

    return savedValue ?? defaultValue;
}
