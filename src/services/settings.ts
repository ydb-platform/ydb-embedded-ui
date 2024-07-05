import {TENANT_PAGES_IDS} from '../store/reducers/tenant/constants';
import {
    ASIDE_HEADER_COMPACT_KEY,
    AUTOCOMPLETE_ON_ENTER,
    AUTO_REFRESH_INTERVAL,
    BINARY_DATA_IN_PLAIN_TEXT_DISPLAY,
    ENABLE_AUTOCOMPLETE,
    INVERTED_DISKS_KEY,
    IS_HOTKEYS_HELP_HIDDEN_KEY,
    LANGUAGE_KEY,
    LAST_USED_QUERY_ACTION_KEY,
    PARTITIONS_HIDDEN_COLUMNS_KEY,
    QUERY_INITIAL_MODE_KEY,
    QUERY_USE_MULTI_SCHEMA_KEY,
    SAVED_QUERIES_KEY,
    TENANT_INITIAL_PAGE_KEY,
    THEME_KEY,
    USE_BACKEND_PARAMS_FOR_TABLES_KEY,
    USE_CLUSTER_BALANCER_AS_BACKEND_KEY,
    USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY,
} from '../utils/constants';
import {QUERY_ACTIONS, QUERY_MODES} from '../utils/query';
import {parseJson} from '../utils/utils';

export type SettingsObject = Record<string, unknown>;

/** User settings keys and their default values */
export const DEFAULT_USER_SETTINGS = {
    [THEME_KEY]: 'system',
    [LANGUAGE_KEY]: undefined,
    [INVERTED_DISKS_KEY]: false,
    [USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY]: true,
    [QUERY_USE_MULTI_SCHEMA_KEY]: true,
    [BINARY_DATA_IN_PLAIN_TEXT_DISPLAY]: true,
    [SAVED_QUERIES_KEY]: [],
    [TENANT_INITIAL_PAGE_KEY]: TENANT_PAGES_IDS.query,
    [QUERY_INITIAL_MODE_KEY]: QUERY_MODES.script,
    [LAST_USED_QUERY_ACTION_KEY]: QUERY_ACTIONS.execute,
    [ASIDE_HEADER_COMPACT_KEY]: true,
    [PARTITIONS_HIDDEN_COLUMNS_KEY]: [],
    [USE_BACKEND_PARAMS_FOR_TABLES_KEY]: false,
    [USE_CLUSTER_BALANCER_AS_BACKEND_KEY]: true,
    [ENABLE_AUTOCOMPLETE]: true,
    [AUTOCOMPLETE_ON_ENTER]: true,
    [IS_HOTKEYS_HELP_HIDDEN_KEY]: false,
    [AUTO_REFRESH_INTERVAL]: 0,
} as const satisfies SettingsObject;

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
