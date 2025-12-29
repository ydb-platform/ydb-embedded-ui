import type {NodesGroupByField, NodesRequiredField, NodesSortValue} from '../../types/api/nodes';
import type {ValueOf} from '../../types/common';
import {
    CAPACITY_METRICS_COLUMN_IDS,
    CAPACITY_METRICS_COLUMN_TITLES,
} from '../capacityMetricsColumns/constants';

import i18n from './i18n';

export const NODES_COLUMNS_WIDTH_LS_KEY = 'nodesTableColumnsWidth';

export const NODES_COLUMNS_IDS = {
    NodeId: 'NodeId',
    Host: 'Host',
    NetworkHost: 'NetworkHost',
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
    TotalSessions: 'TotalSessions',
    Connections: 'Connections',
    NetworkUtilization: 'NetworkUtilization',
    SendThroughput: 'SendThroughput',
    ReceiveThroughput: 'ReceiveThroughput',
    PingTime: 'PingTime',
    ClockSkew: 'ClockSkew',
    Missing: 'Missing',
    Tablets: 'Tablets',
    PDisks: 'PDisks',
    PileName: 'PileName',
    PDiskUsage: CAPACITY_METRICS_COLUMN_IDS.MaxPDiskUsage,
    VDiskSlotUsage: CAPACITY_METRICS_COLUMN_IDS.MaxVDiskSlotUsage,
    CapacityAlert: CAPACITY_METRICS_COLUMN_IDS.CapacityAlert,
} as const;

export type NodesColumnId = ValueOf<typeof NODES_COLUMNS_IDS>;

// Columns, that should displayed only for users with isMonitoringAllowed:true
const MONITORING_USER_COLUMNS_IDS: NodesColumnId[] = ['Pools', 'Memory'];

export function isMonitoringUserNodesColumn(columnId: string): boolean {
    return MONITORING_USER_COLUMNS_IDS.includes(columnId as NodesColumnId);
}

// Columns, that should displayed only for users with isViewerAllowed:true
const VIEWER_USER_COLUMNS_IDS: NodesColumnId[] = ['LoadAverage', 'PDisks'];
export function isViewerUserNodesColumn(columnId: string): boolean {
    return VIEWER_USER_COLUMNS_IDS.some((el) => el === columnId);
}

// This code is running when module is initialized and correct language may not be set yet
// get functions guarantee that i18n fields will be inited on render with current render language
export const NODES_COLUMNS_TITLES = {
    get NodeId() {
        return i18n('node-id');
    },
    get Host() {
        return i18n('host');
    },
    get NetworkHost() {
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
    get TotalSessions() {
        return i18n('sessions');
    },
    get Connections() {
        return i18n('connections');
    },
    get NetworkUtilization() {
        return i18n('utilization');
    },
    get SendThroughput() {
        return i18n('send');
    },
    get ReceiveThroughput() {
        return i18n('receive');
    },
    get PingTime() {
        return i18n('ping');
    },
    get ClockSkew() {
        return i18n('skew');
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
    get PileName() {
        return i18n('field_pile-name');
    },
    get MaxPDiskUsage() {
        return CAPACITY_METRICS_COLUMN_TITLES.MaxPDiskUsage;
    },
    get MaxVDiskSlotUsage() {
        return CAPACITY_METRICS_COLUMN_TITLES.MaxVDiskSlotUsage;
    },
    get CapacityAlert() {
        return CAPACITY_METRICS_COLUMN_TITLES.CapacityAlert;
    },
} as const satisfies Record<NodesColumnId, string>;

const NODES_COLUMNS_GROUP_BY_TITLES = {
    get NodeId() {
        return i18n('node-id');
    },
    get Host() {
        return i18n('host');
    },
    get NodeName() {
        return i18n('node-name');
    },
    get Database() {
        return i18n('database');
    },
    get DiskSpaceUsage() {
        return i18n('disk-usage');
    },
    get DC() {
        return i18n('dc');
    },
    get Rack() {
        return i18n('rack');
    },
    get Missing() {
        return i18n('missing');
    },
    get Uptime() {
        return i18n('uptime');
    },
    get Version() {
        return i18n('version');
    },
    get SystemState() {
        return i18n('system-state');
    },
    get ConnectStatus() {
        return i18n('connect-status');
    },
    get NetworkUtilization() {
        return i18n('network-utilization');
    },
    get ClockSkew() {
        return i18n('clock-skew');
    },
    get PingTime() {
        return i18n('ping-time');
    },
    get PileName() {
        return i18n('field_pile-name');
    },
    get CapacityAlert() {
        return CAPACITY_METRICS_COLUMN_TITLES.CapacityAlert;
    },
} as const satisfies Record<NodesGroupByField, string>;

export function getNodesGroupByFieldTitle(groupByField: NodesGroupByField) {
    return NODES_COLUMNS_GROUP_BY_TITLES[groupByField];
}

// Although columns ids mostly similar to backend fields, there might be some difference
// Also for some columns we may use more than one field
export const NODES_COLUMNS_TO_DATA_FIELDS: Record<NodesColumnId, NodesRequiredField[]> = {
    NodeId: ['NodeId'],
    Host: ['Host', 'Rack', 'Database', 'SystemState'],
    NetworkHost: ['Host', 'Rack', 'Database', 'SystemState', 'ConnectStatus'],
    Database: ['Database'],
    NodeName: ['NodeName'],
    DC: ['DC'],
    Rack: ['Rack'],
    Version: ['Version'],
    Uptime: ['Uptime', 'DisconnectTime'],
    Memory: ['Memory', 'MemoryDetailed'],
    RAM: ['Memory'],
    Pools: ['CPU'],
    CPU: ['CPU'],
    LoadAverage: ['LoadAverage'],
    Load: ['LoadAverage'],
    DiskSpaceUsage: ['DiskSpaceUsage'],
    TotalSessions: ['SystemState'],
    Connections: ['Connections'],
    NetworkUtilization: ['NetworkUtilization'],
    SendThroughput: ['SendThroughput'],
    ReceiveThroughput: ['ReceiveThroughput'],
    PingTime: ['PingTime'],
    ClockSkew: ['ClockSkew'],
    Missing: ['Missing'],
    Tablets: ['Tablets', 'Database'],
    PDisks: ['PDisks'],
    PileName: ['PileName'],
    MaxPDiskUsage: ['MaxPDiskUsage'],
    MaxVDiskSlotUsage: ['MaxVDiskSlotUsage'],
    CapacityAlert: ['CapacityAlert'],
};

const NODES_COLUMNS_TO_SORT_FIELDS: Record<NodesColumnId, NodesSortValue | undefined> = {
    NodeId: 'NodeId',
    Host: 'Host',
    NetworkHost: 'Host',
    Database: 'Database',
    NodeName: 'NodeName',
    DC: 'DC',
    Rack: 'Rack',
    Version: 'Version',
    Uptime: 'Uptime',
    Memory: 'Memory',
    RAM: 'Memory',
    CPU: 'CPU',
    Pools: 'CPU',
    LoadAverage: 'LoadAverage',
    Load: 'LoadAverage',
    DiskSpaceUsage: 'DiskSpaceUsage',
    TotalSessions: undefined,
    Connections: 'Connections',
    NetworkUtilization: 'NetworkUtilization',
    SendThroughput: 'SendThroughput',
    ReceiveThroughput: 'ReceiveThroughput',
    PingTime: 'PingTime',
    ClockSkew: 'ClockSkew',
    Missing: 'Missing',
    Tablets: undefined,
    PDisks: undefined,
    PileName: undefined,
    MaxPDiskUsage: 'MaxPDiskUsage',
    MaxVDiskSlotUsage: 'MaxVDiskSlotUsage',
    CapacityAlert: 'CapacityAlert',
};

export function getNodesColumnSortField(columnId?: string) {
    return NODES_COLUMNS_TO_SORT_FIELDS[columnId as NodesColumnId];
}

export function isSortableNodesColumn(columnId: string) {
    return Boolean(getNodesColumnSortField(columnId));
}

export function isStorageNodesColumnId(column: string): column is NodesColumnId {
    return Object.values(NODES_COLUMNS_IDS).includes(column as NodesColumnId);
}
