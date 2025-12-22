import type {SettingsObject} from '../store/reducers/settings/types';
import {parseJson} from '../utils/utils';

class SettingsManager {
    /**
     * Returns parsed settings value.
     * If value cannot be parsed, returns initially stored string.
     * If there is no value, return default value
     */
    readUserSettingsValue(key: string, defaultValue?: unknown) {
        return this.readValueFromLS(key) ?? defaultValue;
    }

    /**
     * Stringify value and set it to LS
     */
    setUserSettingsValue(key: string, value: unknown) {
        return this.setValueToLS(key, value);
    }

    /**
     * Extract values by provided settings object
     */
    extractSettingsFromLS = (settings: SettingsObject) => {
        return Object.entries(settings).reduce<SettingsObject>((acc, [key, value]) => {
            acc[key] = this.readUserSettingsValue(key, value);
            return acc;
        }, {});
    };

    private readValueFromLS = (key: string): unknown => {
        try {
            const value = localStorage.getItem(key);

            return parseJson(value);
        } catch {
            return undefined;
        }
    };

    private setValueToLS = (key: string, value: unknown): void => {
        try {
            if (typeof value === 'string') {
                localStorage.setItem(key, value);
            } else {
                localStorage.setItem(key, JSON.stringify(value));
            }
        } catch {}
    };
}

export const settingsManager = new SettingsManager();
