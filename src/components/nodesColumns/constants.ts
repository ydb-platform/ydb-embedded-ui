import type {NodesRequiredField} from '../../types/api/nodes';
import type {ValueOf} from '../../types/common';

import i18n from './i18n';

export const NODES_COLUMNS_WIDTH_LS_KEY = 'nodesTableColumnsWidth';

export const NODES_COLUMNS_IDS = {
    NodeId: 'NodeId',
    SystemState: 'SystemState',
    Host: 'Host',
    Database: 'Database',
    NodeName: 'NodeName',
    DC: 'DC',
    Rack: 'Rack',
    Version: 'Version',
    Uptime: 'Uptime',
    Memory: 'Memory',
    RAM: 'RAM',
    CPU: 'CPU',
    Pools: 'Pools',
    LoadAverage: 'LoadAverage',
    Load: 'Load',
    DiskSpaceUsage: 'DiskSpaceUsage',
    SharedCacheUsage: 'SharedCacheUsage',
    TotalSessions: 'TotalSessions',
    Missing: 'Missing',
    Tablets: 'Tablets',
    PDisks: 'PDisks',
} as const;

export type NodesColumnId = ValueOf<typeof NODES_COLUMNS_IDS>;

// This code is running when module is initialized and correct language may not be set yet
// get functions guarantee that i18n fields will be inited on render with current render language
export const NODES_COLUMNS_TITLES = {
    get NodeId() {
        return i18n('node-id');
    },
    get SystemState() {
        return i18n('system-state');
    },
    get Host() {
        return i18n('host');
    },
    get Database() {
        return i18n('database');
    },
    get NodeName() {
        return i18n('node-name');
    },
    get DC() {
        return i18n('dc');
    },
    get Rack() {
        return i18n('rack');
    },
    get Version() {
        return i18n('version');
    },
    get Uptime() {
        return i18n('uptime');
    },
    get Memory() {
        return i18n('memory');
    },
    get RAM() {
        return i18n('ram');
    },
    get Pools() {
        return i18n('pools');
    },
    get CPU() {
        return i18n('cpu');
    },
    get LoadAverage() {
        return i18n('load-average');
    },
    get Load() {
        return i18n('load');
    },
    get DiskSpaceUsage() {
        return i18n('disk-usage');
    },
    get SharedCacheUsage() {
        return i18n('caches');
    },
    get TotalSessions() {
        return i18n('sessions');
    },
    get Missing() {
        return i18n('missing');
    },
    get Tablets() {
        return i18n('tablets');
    },
    get PDisks() {
        return i18n('pdisks');
    },
} as const satisfies Record<NodesColumnId, string>;

// Although columns ids mostly similar to backend fields, there might be some difference
// Also for some columns we may use more than one field
export const NODES_COLUMNS_TO_DATA_FIELDS: Record<NodesColumnId, NodesRequiredField[]> = {
    NodeId: ['NodeId'],
    SystemState: ['SystemState'],
    Host: ['Host', 'Rack', 'Database', 'SystemState'],
    Database: ['Database'],
    NodeName: ['NodeName'],
    DC: ['DC'],
    Rack: ['Rack'],
    Version: ['Version'],
    Uptime: ['Uptime'],
    Memory: ['Memory', 'MemoryDetailed'],
    RAM: ['Memory'],
    Pools: ['CPU'],
    CPU: ['CPU'],
    LoadAverage: ['LoadAverage'],
    Load: ['LoadAverage'],
    DiskSpaceUsage: ['DiskSpaceUsage'],
    SharedCacheUsage: ['SystemState'],
    TotalSessions: ['SystemState'],
    Missing: ['Missing'],
    Tablets: ['Tablets', 'Database'],
    PDisks: ['PDisks'],
};
