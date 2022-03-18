import DataTable from '@yandex-cloud/react-data-table';

const SECOND = 1000;

export const GROUP_AUTO_RELOAD_INTERVAL = 10 * SECOND;
export const PDISK_AUTO_RELOAD_INTERVAL = 10 * SECOND;
export const VDISK_AUTO_RELOAD_INTERVAL = 10 * SECOND;
export const AUTO_RELOAD_INTERVAL = 10 * SECOND;
export const MEGABYTE = 1_000_000;
export const GIGABYTE = 1_000_000_000;
export const TERABYTE = 1_000_000_000_000;
export const GROUP = 'group';

export const DAY_IN_SECONDS = 24 * 60 * 60;

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

export const TABLET_COLOR_TO_STATES = {
    Red: [
        'Created',
        'ResolveStateStorage',
        'Candidate',
        'BlockBlobStorage',
        'WriteZeroEntry',
        'Restored',
        'Discover',
        'Lock',
        'Dead',
    ],
    Orange: ['RebuildGraph'],
    Yellow: ['ResolveMaster', 'ResolveLeader'],
    Green: ['Deleted', 'Active'],
};

export const TABLETS_STATES = [
    'Active',
    'Deleted',
    'Created',
    'ResolveStateStorage',
    'Candidate',
    'BlockBlobStorage',
    'WriteZeroEntry',
    'Restored',
    'Discover',
    'Lock',
    'Dead',
    'RebuildGraph',
    'ResolveLeader',
];

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

export const getTabletLabel = (type) => {
    if (!type) {
        return;
    }
    const defaultValue = type.match(/[A-Z]/g).join('');

    return TABLET_SYMBOLS[type] || defaultValue;
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

export const THEME_KEY = 'theme';
export const SAVED_QUERIES_KEY = 'saved_queries';
export const QUERIES_HISTORY_KEY = 'queries_history';
export const DATA_QA_TUNE_COLUMNS_POPUP = 'tune-columns-popup';

export const defaultUserSettings = {
    [THEME_KEY]: 'light',
};
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
};
