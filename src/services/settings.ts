import {TENANT_PAGES_IDS} from '../store/reducers/tenant/constants';
import {
    ACL_SYNTAX_KEY,
    ASIDE_HEADER_COMPACT_KEY,
    AUTOCOMPLETE_ON_ENTER,
    AUTO_REFRESH_INTERVAL,
    AclSyntax,
    BINARY_DATA_IN_PLAIN_TEXT_DISPLAY,
    CASE_SENSITIVE_JSON_SEARCH,
    ENABLE_AUTOCOMPLETE,
    ENABLE_CODE_ASSISTANT,
    ENABLE_NETWORK_TABLE_KEY,
    ENABLE_QUERY_STREAMING,
    ENABLE_QUERY_STREAMING_OLD_BACKEND,
    EXPAND_CLUSTER_DASHBOARD,
    INVERTED_DISKS_KEY,
    IS_HOTKEYS_HELP_HIDDEN_KEY,
    LANGUAGE_KEY,
    LAST_QUERY_EXECUTION_SETTINGS_KEY,
    LAST_USED_QUERY_ACTION_KEY,
    PARTITIONS_HIDDEN_COLUMNS_KEY,
    QUERY_EXECUTION_SETTINGS_KEY,
    QUERY_SETTINGS_BANNER_LAST_CLOSED_KEY,
    QUERY_STOPPED_BANNER_CLOSED_KEY,
    SAVED_QUERIES_KEY,
    SHOW_DOMAIN_DATABASE_KEY,
    SHOW_NETWORK_UTILIZATION,
    TENANT_INITIAL_PAGE_KEY,
    THEME_KEY,
    USE_CLUSTER_BALANCER_AS_BACKEND_KEY,
    USE_SHOW_PLAN_SVG_KEY,
} from '../utils/constants';
import {DEFAULT_QUERY_SETTINGS, QUERY_ACTIONS} from '../utils/query';
import {parseJson} from '../utils/utils';

export type SettingsObject = Record<string, unknown>;

/** User settings keys and their default values */
export const DEFAULT_USER_SETTINGS = {
    [THEME_KEY]: 'system',
    [LANGUAGE_KEY]: undefined,
    [INVERTED_DISKS_KEY]: false,
    [BINARY_DATA_IN_PLAIN_TEXT_DISPLAY]: true,
    [SAVED_QUERIES_KEY]: [],
    [TENANT_INITIAL_PAGE_KEY]: TENANT_PAGES_IDS.query,
    [LAST_USED_QUERY_ACTION_KEY]: QUERY_ACTIONS.execute,
    [ASIDE_HEADER_COMPACT_KEY]: true,
    [PARTITIONS_HIDDEN_COLUMNS_KEY]: [],
    [ENABLE_NETWORK_TABLE_KEY]: false,
    [USE_SHOW_PLAN_SVG_KEY]: false,
    [USE_CLUSTER_BALANCER_AS_BACKEND_KEY]: true,
    [ENABLE_AUTOCOMPLETE]: true,
    [ENABLE_CODE_ASSISTANT]: true,
    [ENABLE_QUERY_STREAMING]: true,
    [ENABLE_QUERY_STREAMING_OLD_BACKEND]: false,
    [SHOW_NETWORK_UTILIZATION]: false,
    [EXPAND_CLUSTER_DASHBOARD]: true,
    [AUTOCOMPLETE_ON_ENTER]: true,
    [IS_HOTKEYS_HELP_HIDDEN_KEY]: false,
    [AUTO_REFRESH_INTERVAL]: 0,
    [CASE_SENSITIVE_JSON_SEARCH]: false,
    [SHOW_DOMAIN_DATABASE_KEY]: false,
    [QUERY_STOPPED_BANNER_CLOSED_KEY]: false,
    [LAST_QUERY_EXECUTION_SETTINGS_KEY]: undefined,
    [QUERY_SETTINGS_BANNER_LAST_CLOSED_KEY]: undefined,
    [QUERY_EXECUTION_SETTINGS_KEY]: DEFAULT_QUERY_SETTINGS,
    [ACL_SYNTAX_KEY]: AclSyntax.YdbShort,
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
