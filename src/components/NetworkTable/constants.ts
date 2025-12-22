import type {NodesGroupByField} from '../../types/api/nodes';
import type {NodesColumnId} from '../nodesColumns/constants';

export const NETWORK_NODES_TABLE_SELECTED_COLUMNS_KEY = 'networkNodesTableSelectedColumns';

export const NETWORK_DEFAULT_NODES_COLUMNS: NodesColumnId[] = [
    'NodeId',
    'NetworkHost',
    'Connections',
    'NetworkUtilization',
    'SendThroughput',
    'ReceiveThroughput',
    'PingTime',
    'ClockSkew',
];

export const NETWORK_REQUIRED_NODES_COLUMNS: NodesColumnId[] = ['NodeId', 'NetworkHost'];

export const NETWORK_NODES_GROUP_BY_PARAMS = [
    'Host',
    'DC',
    'Rack',
    'Uptime',
    'ConnectStatus',
    'NetworkUtilization',
    'PingTime',
    'ClockSkew',
] as const satisfies NodesGroupByField[];
