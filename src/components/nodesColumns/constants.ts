import type {ValueOf} from '../../types/common';

import i18n from './i18n';

export const NODES_COLUMNS_WIDTH_LS_KEY = 'nodesTableColumnsWidth';

export const NODES_COLUMNS_IDS = {
    NodeId: 'NodeId',
    Host: 'Host',
    NodeName: 'NodeName',
    DC: 'DC',
    Rack: 'Rack',
    Version: 'Version',
    Uptime: 'Uptime',
    Memory: 'Memory',
    CPU: 'CPU',
    LoadAverage: 'LoadAverage',
    Load: 'Load',
    SharedCacheUsage: 'SharedCacheUsage',
    TotalSessions: 'TotalSessions',
    Missing: 'Missing',
    Tablets: 'Tablets',
} as const;

export type NodesColumnId = ValueOf<typeof NODES_COLUMNS_IDS>;

// This code is running when module is initialized and correct language may not be set yet
// get functions guarantee that i18n fields will be inited on render with current render language
export const NODES_COLUMNS_TITLES = {
    get NodeId() {
        return i18n('node-id');
    },
    get Host() {
        return i18n('host');
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
    get CPU() {
        return i18n('cpu');
    },
    get LoadAverage() {
        return i18n('load-average');
    },
    get Load() {
        return i18n('load');
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
} as const satisfies Record<NodesColumnId, string>;
