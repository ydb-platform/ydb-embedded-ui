import type {ETenantType} from '../../types/api/tenant';
import type {ValueOf} from '../../types/common';

import i18n from './i18n';

// Temporarily hide storage usage and quota columns on My databases.
export const SHOW_MY_DATABASES_STORAGE_COLUMNS = false;

export const MY_DATABASE_TYPES = ['Serverless', 'Dedicated'] satisfies ETenantType[];

export const DATABASES_TABLE_SETTINGS_KEYS = {
    columns: 'databasesTableSelectedColumns',
    widths: 'databasesTableColumnsWidth',
};

export const MY_DATABASES_TABLE_SETTINGS_KEYS = {
    columns: 'myDatabasesTableSelectedColumns',
    widths: 'myDatabasesTableColumnsWidth',
};

export const DATABASES_COLUMNS_IDS = {
    Name: 'Name',
    Type: 'Type',
    State: 'State',
    BridgeMode: 'BridgeMode',
    BridgeSyncStatus: 'BridgeSyncStatus',
    CPU: 'cpu',
    AllocatedCPU: 'allocatedCpuCores',
    Memory: 'memory',
    AllocatedMemory: 'allocatedMemory',
    Storage: 'storage',
    StorageQuotaUsed: 'storageQuotaUsed',
    StorageQuotaLimit: 'storageQuotaLimit',
    Network: 'Network',
    NodesCount: 'nodesCount',
    GroupsCount: 'groupsCount',
    PoolStats: 'PoolStats',
} as const;

export type DatabasesColumnId = ValueOf<typeof DATABASES_COLUMNS_IDS>;

export const DATABASES_DEFAULT_COLUMNS: DatabasesColumnId[] = [
    DATABASES_COLUMNS_IDS.Name,
    DATABASES_COLUMNS_IDS.Type,
    DATABASES_COLUMNS_IDS.State,
    DATABASES_COLUMNS_IDS.BridgeMode,
    DATABASES_COLUMNS_IDS.BridgeSyncStatus,
    DATABASES_COLUMNS_IDS.CPU,
    DATABASES_COLUMNS_IDS.AllocatedCPU,
    DATABASES_COLUMNS_IDS.Memory,
    DATABASES_COLUMNS_IDS.AllocatedMemory,
    DATABASES_COLUMNS_IDS.Storage,
    DATABASES_COLUMNS_IDS.StorageQuotaUsed,
    DATABASES_COLUMNS_IDS.StorageQuotaLimit,
    DATABASES_COLUMNS_IDS.Network,
    DATABASES_COLUMNS_IDS.NodesCount,
    DATABASES_COLUMNS_IDS.GroupsCount,
    DATABASES_COLUMNS_IDS.PoolStats,
];
export const MY_DATABASES_DEFAULT_COLUMNS = DATABASES_DEFAULT_COLUMNS.filter(
    (id) =>
        id !== DATABASES_COLUMNS_IDS.Storage &&
        id !== DATABASES_COLUMNS_IDS.NodesCount &&
        id !== DATABASES_COLUMNS_IDS.GroupsCount,
);

export const DATABASES_REQUIRED_COLUMNS: DatabasesColumnId[] = [DATABASES_COLUMNS_IDS.Name];

export const DATABASES_COLUMNS_TITLES = {
    get [DATABASES_COLUMNS_IDS.Name]() {
        return i18n('column-name');
    },
    get [DATABASES_COLUMNS_IDS.Type]() {
        return i18n('column-type');
    },
    get [DATABASES_COLUMNS_IDS.State]() {
        return i18n('column-state');
    },
    get [DATABASES_COLUMNS_IDS.BridgeMode]() {
        return i18n('column-mode');
    },
    get [DATABASES_COLUMNS_IDS.BridgeSyncStatus]() {
        return i18n('column-sync-status');
    },
    get [DATABASES_COLUMNS_IDS.CPU]() {
        return i18n('column-cpu');
    },
    get [DATABASES_COLUMNS_IDS.AllocatedCPU]() {
        return i18n('field_allocated-cpu');
    },
    get [DATABASES_COLUMNS_IDS.Memory]() {
        return i18n('column-memory');
    },
    get [DATABASES_COLUMNS_IDS.AllocatedMemory]() {
        return i18n('field_allocated-memory');
    },
    get [DATABASES_COLUMNS_IDS.Storage]() {
        return i18n('column-storage');
    },
    get [DATABASES_COLUMNS_IDS.StorageQuotaUsed]() {
        return i18n('column_quota-used');
    },
    get [DATABASES_COLUMNS_IDS.StorageQuotaLimit]() {
        return i18n('column_quota-limit');
    },
    get [DATABASES_COLUMNS_IDS.Network]() {
        return i18n('column-network');
    },
    get [DATABASES_COLUMNS_IDS.NodesCount]() {
        return i18n('column-nodes');
    },
    get [DATABASES_COLUMNS_IDS.GroupsCount]() {
        return i18n('column-groups');
    },
    get [DATABASES_COLUMNS_IDS.PoolStats]() {
        return i18n('column-pools');
    },
} as const satisfies Record<DatabasesColumnId, string>;
