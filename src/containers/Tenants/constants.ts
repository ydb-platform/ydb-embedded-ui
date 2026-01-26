import type {ValueOf} from '../../types/common';

import i18n from './i18n';

export const DATABASES_SELECTED_COLUMNS_KEY = 'databasesTableSelectedColumns';

export const DATABASES_COLUMNS_IDS = {
    Name: 'Name',
    Type: 'Type',
    State: 'State',
    CPU: 'cpu',
    Memory: 'memory',
    Storage: 'storage',
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
    DATABASES_COLUMNS_IDS.CPU,
    DATABASES_COLUMNS_IDS.Memory,
    DATABASES_COLUMNS_IDS.Storage,
    DATABASES_COLUMNS_IDS.Network,
    DATABASES_COLUMNS_IDS.NodesCount,
    DATABASES_COLUMNS_IDS.GroupsCount,
    DATABASES_COLUMNS_IDS.PoolStats,
];
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
    get [DATABASES_COLUMNS_IDS.CPU]() {
        return i18n('column-cpu');
    },
    get [DATABASES_COLUMNS_IDS.Memory]() {
        return i18n('column-memory');
    },
    get [DATABASES_COLUMNS_IDS.Storage]() {
        return i18n('column-storage');
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
