import type {ValueOf} from '../../../types/common';

import i18n from './i18n';

export const NODES_COLUMNS_WIDTH_LS_KEY = 'nodesTableColumnsWidth';

export const NODES_COLUMNS_IDS = {
    NodeId: 'NodeId',
    Host: 'Host',
    DC: 'DC',
    Rack: 'Rack',
    Version: 'Version',
    Uptime: 'Uptime',
    Memory: 'Memory',
    CPU: 'CPU',
    LoadAverage: 'LoadAverage',
    Tablets: 'Tablets',
    TopNodesLoadAverage: 'TopNodesLoadAverage',
    TopNodesMemory: 'TopNodesMemory',
    SharedCacheUsage: 'SharedCacheUsage',
    TotalSessions: 'TotalSessions',
} as const;

type NodeColumnId = ValueOf<typeof NODES_COLUMNS_IDS>;

export const NODES_COLUMNS_TITLES = {
    get NodeId() {
        return i18n('node-id');
    },
    get Host() {
        return i18n('host');
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
    get Tablets() {
        return i18n('tablets');
    },
    get TopNodesLoadAverage() {
        return i18n('load');
    },
    get TopNodesMemory() {
        return i18n('process');
    },
    get SharedCacheUsage() {
        return i18n('caches');
    },
    get TotalSessions() {
        return i18n('sessions');
    },
} as const satisfies Record<NodeColumnId, string>;