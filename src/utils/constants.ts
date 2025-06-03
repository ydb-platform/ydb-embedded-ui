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

export const TENANT_OVERVIEW_TABLES_LIMIT = 5;

export const EMPTY_DATA_PLACEHOLDER = '—';

export const QUERY_TECHNICAL_MARK = '/*UI-QUERY-EXCLUDE*/';

// ==== Titles ====
export const DEVELOPER_UI_TITLE = 'Developer UI';
export const CLUSTER_DEFAULT_TITLE = 'Cluster';
export const TENANT_DEFAULT_TITLE = 'Database';

// ==== Settings ====
export const THEME_KEY = 'theme';
export const LANGUAGE_KEY = 'language';
export const INVERTED_DISKS_KEY = 'invertedDisks';
export const SAVED_QUERIES_KEY = 'saved_queries';
export const ASIDE_HEADER_COMPACT_KEY = 'asideHeaderCompact';
export const QUERIES_HISTORY_KEY = 'queries_history';
export const BINARY_DATA_IN_PLAIN_TEXT_DISPLAY = 'binaryDataInPlainTextDisplay';
export const AUTO_REFRESH_INTERVAL = 'auto-refresh-interval';

export const CASE_SENSITIVE_JSON_SEARCH = 'caseSensitiveJsonSearch';

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

export const QUERY_EXECUTION_SETTINGS_KEY = 'queryExecutionSettings';
export const LAST_QUERY_EXECUTION_SETTINGS_KEY = 'last_query_execution_settings';
export const QUERY_SETTINGS_BANNER_LAST_CLOSED_KEY = 'querySettingsBannerLastClosed';
export const QUERY_STOPPED_BANNER_CLOSED_KEY = 'queryStoppedBannerClosed';

export const LAST_USED_QUERY_ACTION_KEY = 'last_used_query_action';

export const PARTITIONS_HIDDEN_COLUMNS_KEY = 'partitionsHiddenColumns';

// Remain "tab" in key name for backward compatibility
export const TENANT_INITIAL_PAGE_KEY = 'saved_tenant_initial_tab';

export const ENABLE_NETWORK_TABLE_KEY = 'enableNetworkTable';

export const USE_SHOW_PLAN_SVG_KEY = 'useShowPlanToSvg';

// Setting to hide domain in database list
export const SHOW_DOMAIN_DATABASE_KEY = 'showDomainDatabase';

export const USE_CLUSTER_BALANCER_AS_BACKEND_KEY = 'useClusterBalancerAsBacked';

export const ENABLE_AUTOCOMPLETE = 'enableAutocomplete';

export const ENABLE_CODE_ASSISTANT = 'enableCodeAssistant';

export const ENABLE_AI_ASSISTANT = 'enableAIAssistant';

export const ENABLE_QUERY_STREAMING = 'enableQueryStreaming';

export const AUTOCOMPLETE_ON_ENTER = 'autocompleteOnEnter';

export const IS_HOTKEYS_HELP_HIDDEN_KEY = 'isHotKeysHelpHidden';

export const DEV_ENABLE_TRACING_FOR_ALL_REQUESTS = 'enable_tracing_for_all_requests';

export const SHOW_NETWORK_UTILIZATION = 'enableNetworkUtilization';

export const EXPAND_CLUSTER_DASHBOARD = 'expandClusterDashboard';
