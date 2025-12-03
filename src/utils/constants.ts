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
export const UNBREAKABLE_GAP = '\u00A0';

export const QUERY_TECHNICAL_MARK = '/*UI-QUERY-EXCLUDE*/';

// ==== Titles ====
export const DEVELOPER_UI_TITLE = 'Developer UI';
export const MONITORING_UI_TITLE = 'Monium';
export const CLUSTER_DEFAULT_TITLE = 'Cluster';
export const TENANT_DEFAULT_TITLE = 'Database';

// ==== Settings ====

export const QUERY_EDITOR_CURRENT_QUERY_KEY = 'query_editor_current_query';
export const QUERY_EDITOR_DIRTY_KEY = 'query_editor_dirty';

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

export const OLD_BACKEND_CLUSTER_NAMES = [
    'cloud_prod_kikimr_global',
    'cloud_preprod_kikimr_global',
    'cloud_prod_kikimr_ydb_public_storage',
];

export const DEV_ENABLE_TRACING_FOR_ALL_REQUESTS = 'enable_tracing_for_all_requests';

export enum AclSyntax {
    Kikimr = 'kikimr',
    YdbShort = 'ydb-short',
    Ydb = 'ydb',
    Yql = 'yql',
}

export const YDB_POPOVER_CLASS_NAME = 'ydb-popover';
