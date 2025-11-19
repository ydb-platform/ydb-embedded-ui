import type {ValueOf} from '../../../types/common';
import {AclSyntax} from '../../../utils/constants';
import {Lang} from '../../../utils/i18n';
import {DEFAULT_QUERY_SETTINGS, QUERY_ACTIONS} from '../../../utils/query';
import {TENANT_PAGES_IDS} from '../tenant/constants';

import type {SettingOptions} from './types';

export const SETTING_KEYS = {
    THEME: 'theme',
    LANGUAGE: 'language',
    INVERTED_DISKS: 'invertedDisks',
    BINARY_DATA_IN_PLAIN_TEXT_DISPLAY: 'binaryDataInPlainTextDisplay',
    SAVED_QUERIES: 'saved_queries',
    QUERIES_HISTORY: 'queries_history',
    TENANT_INITIAL_PAGE: 'saved_tenant_initial_tab',
    LAST_USED_QUERY_ACTION: 'last_used_query_action',
    ASIDE_HEADER_COMPACT: 'asideHeaderCompact',
    PARTITIONS_HIDDEN_COLUMNS: 'partitionsHiddenColumns',
    ENABLE_NETWORK_TABLE: 'enableNetworkTable',
    USE_SHOW_PLAN_SVG: 'useShowPlanToSvg',
    USE_CLUSTER_BALANCER_AS_BACKEND: 'useClusterBalancerAsBacked',
    ENABLE_AUTOCOMPLETE: 'enableAutocomplete',
    ENABLE_CODE_ASSISTANT: 'enableCodeAssistant',
    ENABLE_QUERY_STREAMING: 'enableQueryStreaming',
    ENABLE_QUERY_STREAMING_OLD_BACKEND: 'enableQueryStreamingOldBackend',
    SHOW_NETWORK_UTILIZATION: 'enableNetworkUtilization',
    EXPAND_CLUSTER_DASHBOARD: 'expandClusterDashboard',
    AUTOCOMPLETE_ON_ENTER: 'autocompleteOnEnter',
    IS_HOTKEYS_HELP_HIDDEN: 'isHotKeysHelpHidden',
    AUTO_REFRESH_INTERVAL: 'auto-refresh-interval',
    CASE_SENSITIVE_JSON_SEARCH: 'caseSensitiveJsonSearch',
    SHOW_DOMAIN_DATABASE: 'showDomainDatabase',
    QUERY_STOPPED_BANNER_CLOSED: 'queryStoppedBannerClosed',
    LAST_QUERY_EXECUTION_SETTINGS: 'last_query_execution_settings',
    QUERY_SETTINGS_BANNER_LAST_CLOSED: 'querySettingsBannerLastClosed',
    QUERY_EXECUTION_SETTINGS: 'queryExecutionSettings',
    ACL_SYNTAX: 'aclSyntax',
} as const;

export type SettingKey = ValueOf<typeof SETTING_KEYS>;

/** User settings keys and their default values */
export const DEFAULT_USER_SETTINGS = {
    [SETTING_KEYS.THEME]: 'system',
    [SETTING_KEYS.LANGUAGE]: Lang.En,
    [SETTING_KEYS.INVERTED_DISKS]: false,
    [SETTING_KEYS.BINARY_DATA_IN_PLAIN_TEXT_DISPLAY]: true,
    [SETTING_KEYS.SAVED_QUERIES]: [],
    [SETTING_KEYS.QUERIES_HISTORY]: [],
    [SETTING_KEYS.TENANT_INITIAL_PAGE]: TENANT_PAGES_IDS.query,
    [SETTING_KEYS.LAST_USED_QUERY_ACTION]: QUERY_ACTIONS.execute,
    [SETTING_KEYS.ASIDE_HEADER_COMPACT]: true,
    [SETTING_KEYS.PARTITIONS_HIDDEN_COLUMNS]: [],
    [SETTING_KEYS.ENABLE_NETWORK_TABLE]: true,
    [SETTING_KEYS.USE_SHOW_PLAN_SVG]: false,
    [SETTING_KEYS.USE_CLUSTER_BALANCER_AS_BACKEND]: true,
    [SETTING_KEYS.ENABLE_AUTOCOMPLETE]: true,
    [SETTING_KEYS.ENABLE_CODE_ASSISTANT]: true,
    [SETTING_KEYS.ENABLE_QUERY_STREAMING]: true,
    [SETTING_KEYS.ENABLE_QUERY_STREAMING_OLD_BACKEND]: false,
    [SETTING_KEYS.SHOW_NETWORK_UTILIZATION]: true,
    [SETTING_KEYS.EXPAND_CLUSTER_DASHBOARD]: true,
    [SETTING_KEYS.AUTOCOMPLETE_ON_ENTER]: true,
    [SETTING_KEYS.IS_HOTKEYS_HELP_HIDDEN]: false,
    [SETTING_KEYS.AUTO_REFRESH_INTERVAL]: 0,
    [SETTING_KEYS.CASE_SENSITIVE_JSON_SEARCH]: false,
    [SETTING_KEYS.SHOW_DOMAIN_DATABASE]: false,
    [SETTING_KEYS.QUERY_STOPPED_BANNER_CLOSED]: false,
    [SETTING_KEYS.LAST_QUERY_EXECUTION_SETTINGS]: undefined,
    [SETTING_KEYS.QUERY_SETTINGS_BANNER_LAST_CLOSED]: undefined,
    [SETTING_KEYS.QUERY_EXECUTION_SETTINGS]: DEFAULT_QUERY_SETTINGS,
    [SETTING_KEYS.ACL_SYNTAX]: AclSyntax.YdbShort,
} as const satisfies Record<SettingKey, unknown>;

export const SETTINGS_OPTIONS: Record<string, SettingOptions | undefined> = {
    [SETTING_KEYS.THEME]: {
        preventBatching: true,
    },
    [SETTING_KEYS.SAVED_QUERIES]: {
        preventSyncWithLS: true,
    },
    [SETTING_KEYS.QUERIES_HISTORY]: {
        preventSyncWithLS: true,
    },
} as const;
