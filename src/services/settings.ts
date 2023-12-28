import {TENANT_PAGES_IDS} from '../store/reducers/tenant/constants';

import {
    ASIDE_HEADER_COMPACT_KEY,
    CLUSTER_INFO_HIDDEN_KEY,
    INVERTED_DISKS_KEY,
    LANGUAGE_KEY,
    LAST_USED_QUERY_ACTION_KEY,
    PARTITIONS_HIDDEN_COLUMNS_KEY,
    QUERY_INITIAL_MODE_KEY,
    QUERY_USE_MULTI_SCHEMA_KEY,
    SAVED_QUERIES_KEY,
    TENANT_INITIAL_PAGE_KEY,
    THEME_KEY,
    USE_BACKEND_PARAMS_FOR_TABLES_KEY,
    USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY,
} from '../utils/constants';
import {QUERY_ACTIONS, QUERY_MODES} from '../utils/query';
import {parseJson} from '../utils/utils';

export type SettingsObject = Record<string, unknown>;

const USE_LOCAL_STORAGE_FOR_SETTINGS_KEY = 'useLocalStorageForSettings';

/** User settings keys and their default values */
const DEFAULT_USER_SETTINGS: SettingsObject = {
    [THEME_KEY]: 'system',
    [LANGUAGE_KEY]: undefined,
    [INVERTED_DISKS_KEY]: false,
    [USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY]: false,
    [QUERY_USE_MULTI_SCHEMA_KEY]: false,
    [SAVED_QUERIES_KEY]: [],
    [TENANT_INITIAL_PAGE_KEY]: TENANT_PAGES_IDS.query,
    [QUERY_INITIAL_MODE_KEY]: QUERY_MODES.script,
    [LAST_USED_QUERY_ACTION_KEY]: QUERY_ACTIONS.execute,
    [ASIDE_HEADER_COMPACT_KEY]: true,
    [PARTITIONS_HIDDEN_COLUMNS_KEY]: [],
    [CLUSTER_INFO_HIDDEN_KEY]: true,
    [USE_BACKEND_PARAMS_FOR_TABLES_KEY]: false,
};

class SettingsManager {
    constructor() {
        // Migrate settings to LS if external API was used before
        const settingsApi = window.web_version ? window.systemSettings?.settingsApi : undefined;

        const useLocalStorage = this.readUserSettingsValue(USE_LOCAL_STORAGE_FOR_SETTINGS_KEY);

        if (settingsApi && !useLocalStorage) {
            const externalUserSettings = window.userSettings;

            if (externalUserSettings) {
                Object.entries(externalUserSettings).forEach(([key, value]) =>
                    this.setUserSettingsValue(key, value),
                );
            }

            this.setUserSettingsValue(USE_LOCAL_STORAGE_FOR_SETTINGS_KEY, true);
        }
    }

    /**
     * User settings - settings stored in LS or external store
     */
    getUserSettings() {
        return this.extractSettingsFromLS();
    }

    /**
     * Returns parsed settings value.
     * If value cannot be parsed, returns initially stored string.
     * If there is no value, return default value
     */
    readUserSettingsValue(key: string, defaultValue?: unknown) {
        return this.readValueFromLS(key) ?? defaultValue ?? DEFAULT_USER_SETTINGS[key];
    }

    /**
     * Stringify value and set it to LS
     */
    setUserSettingsValue(key: string, value: unknown) {
        return this.setValueToLS(key, value);
    }

    private extractSettingsFromLS = () => {
        return Object.entries(DEFAULT_USER_SETTINGS).reduce<SettingsObject>((acc, [key, value]) => {
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
