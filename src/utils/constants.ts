import DataTable from '@gravity-ui/react-data-table';

const SECOND = 1000;

export const GROUP_AUTO_RELOAD_INTERVAL = 10 * SECOND;
export const PDISK_AUTO_RELOAD_INTERVAL = 10 * SECOND;
export const VDISK_AUTO_RELOAD_INTERVAL = 10 * SECOND;
export const AUTO_RELOAD_INTERVAL = 10 * SECOND;
// by agreement, display all byte values in decimal scale
// values in data are always in bytes, never in higher units,
// therefore there is no issue arbitrary converting them in UI
export const KILOBYTE = 1_000;
export const MEGABYTE = 1_000_000;
export const GIGABYTE = 1_000_000_000;
export const TERABYTE = 1_000_000_000_000;
export const GROUP = 'group';

export const MINUTE_IN_SECONDS = 60;
export const HOUR_IN_SECONDS = 60 * MINUTE_IN_SECONDS;
export const DAY_IN_SECONDS = 24 * HOUR_IN_SECONDS;

export const MS_IN_NANOSECONDS = 1000000;

export const TABLET_STATES = {
    TABLET_VOLATILE_STATE_UNKNOWN: 'unknown',
    TABLET_VOLATILE_STATE_STOPPED: 'stopped',
    TABLET_VOLATILE_STATE_BOOTING: 'booting',
    TABLET_VOLATILE_STATE_STARTING: 'starting',
    TABLET_VOLATILE_STATE_RUNNING: 'running',
    TABLET_VOLATILE_STATE_BLOCKED: 'blocked',
};

export const TABLET_COLORS = {
    Created: 'gray',
    ResolveStateStorage: 'lightgray',
    Candidate: 'lightgray',
    BlockBlobStorage: 'lightgray',
    RebuildGraph: 'yellow',
    Restored: 'yellow',
    Discover: 'orange',
    Lock: 'lightblue',
    Dead: 'black',
    Active: 'lightgreen',
};

export const TxAllocator = 'TxAllocator';

export const TABLET_SYMBOLS = {
    OldTxProxy: 'P',
    TxProxy: 'P',
    BSController: 'BS',
    Dummy: 'DY',
    RTMRPartition: 'RP',
    PersQueueReadBalancer: 'PB',
    Cms: 'CM',
    BlockStorePartition: 'BP',
    BlockStoreVolume: 'BV',
    Console: 'CN',
    TenantSlotBroker: 'TB',
};

const isTabletType = (type: string): type is keyof typeof TABLET_SYMBOLS => type in TABLET_SYMBOLS;

export const getTabletLabel = (type?: string) => {
    if (!type) {
        return undefined;
    }
    const defaultValue = type.match(/[A-Z]/g)?.join('');

    return isTabletType(type) ? TABLET_SYMBOLS[type] : defaultValue;
};

export const LOAD_AVERAGE_TIME_INTERVALS = ['1 min', '5 min', '15 min'];

export const PDISK_CATEGORIES = {
    0: 'HDD',
    1: 'SSD',
};

export const COLORS_PRIORITY = {
    green: 5,
    yellow: 4,
    orange: 3,
    red: 2,
    blue: 1,
    grey: 1,
};

export const ALL = 'All';
export const PROBLEMS = 'With problems';

export type IProblemFilterValues = typeof ALL | typeof PROBLEMS;

export const THEME_KEY = 'theme';
export const INVERTED_DISKS_KEY = 'invertedDisks';
export const USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY = 'useNodesEndpointInDiagnostics';
export const SAVED_QUERIES_KEY = 'saved_queries';
export const ASIDE_HEADER_COMPACT_KEY = 'asideHeaderCompact';
export const QUERIES_HISTORY_KEY = 'queries_history';
export const DATA_QA_TUNE_COLUMNS_POPUP = 'tune-columns-popup';

export const DEFAULT_SIZE_RESULT_PANE_KEY = 'default-size-result-pane';
export const DEFAULT_SIZE_TENANT_SUMMARY_KEY = 'default-size-tenant-summary-pane';
export const DEFAULT_SIZE_TENANT_KEY = 'default-size-tenant-pane';

export const DEFAULT_IS_TENANT_SUMMARY_COLLAPSED = 'default-is-tenant-summary-collapsed';

export const DEFAULT_IS_TENANT_COMMON_INFO_COLLAPSED = 'default-is-tenant-common-info-collapsed';

export const DEFAULT_IS_QUERY_RESULT_COLLAPSED = 'default-is-query-result-collapsed';

export const DEFAULT_TABLE_SETTINGS = {
    displayIndices: false,
    stickyHead: DataTable.MOVING,
    syncHeadOnResize: true,
    dynamicRender: true,
    highlightRows: true,
} as const;

export const TENANT_INITIAL_TAB_KEY = 'saved_tenant_initial_tab';
export const QUERY_INITIAL_RUN_ACTION_KEY = 'query_initial_run_action';

export const PARTITIONS_SELECTED_COLUMNS_KEY = 'partitionsSelectedColumns';
