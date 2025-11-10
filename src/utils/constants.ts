import DataTable from '@gravity-ui/react-data-table';
import type {Settings} from '@gravity-ui/react-data-table';

import {EType} from '../types/api/tablet';

// by agreement, display all byte values in decimal scale
// values in data are always in bytes, never in higher units,
// therefore there is no issue arbitrary converting them in UI
export const KILOBYTE = 1_000;
export const MEGABYTE = 1_000_000;
export const GIGABYTE = 1_000_000_000;
export const TERABYTE = 1_000_000_000_000;

export const SECOND_IN_MS = 1000;
export const MINUTE_IN_SECONDS = 60;
export const HOUR_IN_SECONDS = 60 * MINUTE_IN_SECONDS;
export const DAY_IN_SECONDS = 24 * HOUR_IN_SECONDS;
export const WEEK_IN_SECONDS = 7 * DAY_IN_SECONDS;

export const MS_IN_NANOSECONDS = 1000000;

export const DEFAULT_WARNING_THRESHOLD = 85;
export const DEFAULT_DANGER_THRESHOLD = 95;

const TABLET_SYMBOLS = {
    [EType.OldTxProxy]: 'P',
    [EType.TxProxy]: 'P',
    [EType.BSController]: 'BS',
    [EType.Dummy]: 'DY',
    [EType.RTMRPartition]: 'RP',
    [EType.PersQueueReadBalancer]: 'PB',
    [EType.Cms]: 'CM',
    [EType.BlockStorePartition]: 'BP',
    [EType.BlockStoreVolume]: 'BV',
    [EType.Console]: 'CN',
    [EType.TenantSlotBroker]: 'TB',
    [EType.BlockStoreDiskRegistry]: 'BDR',
};

const isTabletType = (type: string): type is keyof typeof TABLET_SYMBOLS => type in TABLET_SYMBOLS;

export const getTabletLabel = (type?: string) => {
    if (!type) {
        return undefined;
    }
    const defaultValue = type.match(/[A-Z]/g)?.join('');

    return isTabletType(type) ? TABLET_SYMBOLS[type] : defaultValue;
};

// Settings Keys Dictionary
export const SETTING_KEYS = {
    THEME: 'theme',
    LANGUAGE: 'language',
    INVERTED_DISKS: 'invertedDisks',
    BINARY_DATA_IN_PLAIN_TEXT_DISPLAY: 'binaryDataInPlainTextDisplay',
    SAVED_QUERIES: 'saved_queries',
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

// Page IDs Dictionary
export const PAGE_IDS = {
    GENERAL: 'generalPage',
    EDITOR: 'editorPage',
    EXPERIMENTS: 'experimentsPage',
    ABOUT: 'aboutPage',
} as const;

// Section IDs Dictionary
export const SECTION_IDS = {
    EXPERIMENTS: 'experimentsSection',
    GENERAL: 'generalSection',
    APPEARANCE: 'appearanceSection',
    DEV_SETTINGS: 'devSettingsSection',
    ABOUT: 'aboutSettingsSection',
} as const;

export const TENANT_OVERVIEW_TABLES_LIMIT = 3;

export const EMPTY_DATA_PLACEHOLDER = '—';
export const NON_BREAKING_SPACE = '\u00A0';

export const QUERY_TECHNICAL_MARK = '/*UI-QUERY-EXCLUDE*/';

// ==== Titles ====
export const DEVELOPER_UI_TITLE = 'Developer UI';
export const MONITORING_UI_TITLE = 'Monium';
export const CLUSTER_DEFAULT_TITLE = 'Cluster';
export const TENANT_DEFAULT_TITLE = 'Database';

// ==== Settings ====
export const THEME_KEY = SETTING_KEYS.THEME;
export const LANGUAGE_KEY = SETTING_KEYS.LANGUAGE;
export const INVERTED_DISKS_KEY = SETTING_KEYS.INVERTED_DISKS;
export const SAVED_QUERIES_KEY = SETTING_KEYS.SAVED_QUERIES;
export const ASIDE_HEADER_COMPACT_KEY = SETTING_KEYS.ASIDE_HEADER_COMPACT;
export const QUERIES_HISTORY_KEY = 'queries_history';

export const QUERY_EDITOR_CURRENT_QUERY_KEY = 'query_editor_current_query';
export const QUERY_EDITOR_DIRTY_KEY = 'query_editor_dirty';

export const BINARY_DATA_IN_PLAIN_TEXT_DISPLAY = SETTING_KEYS.BINARY_DATA_IN_PLAIN_TEXT_DISPLAY;
export const AUTO_REFRESH_INTERVAL = SETTING_KEYS.AUTO_REFRESH_INTERVAL;

export const CASE_SENSITIVE_JSON_SEARCH = SETTING_KEYS.CASE_SENSITIVE_JSON_SEARCH;

export const DEFAULT_SIZE_RESULT_PANE_KEY = 'default-size-result-pane';
export const DEFAULT_SIZE_TENANT_SUMMARY_KEY = 'default-size-tenant-summary-pane';
export const DEFAULT_SIZE_TENANT_KEY = 'default-size-tenant-pane';

export const DEFAULT_IS_TENANT_SUMMARY_COLLAPSED = 'default-is-tenant-summary-collapsed';

export const DEFAULT_IS_TENANT_COMMON_INFO_COLLAPSED = 'default-is-tenant-common-info-collapsed';

export const DEFAULT_IS_QUERY_RESULT_COLLAPSED = 'default-is-query-result-collapsed';

export const DEFAULT_CLUSTER_TAB_KEY = 'default-cluster-tab';

export const DEFAULT_TABLE_SETTINGS: Settings = {
    displayIndices: false,
    stickyHead: DataTable.MOVING,
    syncHeadOnResize: true,
    dynamicRender: true,
    highlightRows: true,
} as const;

export const TENANT_OVERVIEW_TABLES_SETTINGS: Settings = {
    ...DEFAULT_TABLE_SETTINGS,
    stickyHead: 'fixed',
    dynamicRender: false,
    sortable: false,
} as const;

export const QUERY_EXECUTION_SETTINGS_KEY = SETTING_KEYS.QUERY_EXECUTION_SETTINGS;
export const LAST_QUERY_EXECUTION_SETTINGS_KEY = SETTING_KEYS.LAST_QUERY_EXECUTION_SETTINGS;
export const QUERY_SETTINGS_BANNER_LAST_CLOSED_KEY = SETTING_KEYS.QUERY_SETTINGS_BANNER_LAST_CLOSED;
export const QUERY_STOPPED_BANNER_CLOSED_KEY = SETTING_KEYS.QUERY_STOPPED_BANNER_CLOSED;

export const LAST_USED_QUERY_ACTION_KEY = SETTING_KEYS.LAST_USED_QUERY_ACTION;

export const PARTITIONS_HIDDEN_COLUMNS_KEY = SETTING_KEYS.PARTITIONS_HIDDEN_COLUMNS;

// Remain "tab" in key name for backward compatibility
export const TENANT_INITIAL_PAGE_KEY = SETTING_KEYS.TENANT_INITIAL_PAGE;

export const ENABLE_NETWORK_TABLE_KEY = SETTING_KEYS.ENABLE_NETWORK_TABLE;

export const USE_SHOW_PLAN_SVG_KEY = SETTING_KEYS.USE_SHOW_PLAN_SVG;

// Setting to hide domain in database list
export const SHOW_DOMAIN_DATABASE_KEY = SETTING_KEYS.SHOW_DOMAIN_DATABASE;

export const USE_CLUSTER_BALANCER_AS_BACKEND_KEY = SETTING_KEYS.USE_CLUSTER_BALANCER_AS_BACKEND;

export const ENABLE_AUTOCOMPLETE = SETTING_KEYS.ENABLE_AUTOCOMPLETE;

export const ENABLE_CODE_ASSISTANT = SETTING_KEYS.ENABLE_CODE_ASSISTANT;

export const ENABLE_QUERY_STREAMING = SETTING_KEYS.ENABLE_QUERY_STREAMING;

export const ENABLE_QUERY_STREAMING_OLD_BACKEND = SETTING_KEYS.ENABLE_QUERY_STREAMING_OLD_BACKEND;

export const OLD_BACKEND_CLUSTER_NAMES = [
    'cloud_prod_kikimr_global',
    'cloud_preprod_kikimr_global',
    'cloud_prod_kikimr_ydb_public_storage',
];

export const AUTOCOMPLETE_ON_ENTER = SETTING_KEYS.AUTOCOMPLETE_ON_ENTER;

export const IS_HOTKEYS_HELP_HIDDEN_KEY = SETTING_KEYS.IS_HOTKEYS_HELP_HIDDEN;

export const DEV_ENABLE_TRACING_FOR_ALL_REQUESTS = 'enable_tracing_for_all_requests';

export const SHOW_NETWORK_UTILIZATION = SETTING_KEYS.SHOW_NETWORK_UTILIZATION;

export const EXPAND_CLUSTER_DASHBOARD = SETTING_KEYS.EXPAND_CLUSTER_DASHBOARD;

export const ACL_SYNTAX_KEY = SETTING_KEYS.ACL_SYNTAX;

export enum AclSyntax {
    Kikimr = 'kikimr',
    YdbShort = 'ydb-short',
    Ydb = 'ydb',
    Yql = 'yql',
}

export const YDB_POPOVER_CLASS_NAME = 'ydb-popover';
