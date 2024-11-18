import type {NodesColumnId} from '../../../../../components/nodesColumns/constants';
import type {NodesGroupByField} from '../../../../../types/api/nodes';

export const NETWORK_NODES_TABLE_SELECTED_COLUMNS_KEY = 'networkNodesTableSelectedColumns';

export const NETWORK_DEFAULT_NODES_COLUMNS: NodesColumnId[] = [
    'NodeId',
    'Host',
    'Connections',
    'NetworkUtilization',
    'SendThroughput',
    'ReceiveThroughput',
    'PingTime',
    'ClockSkew',
];

export const NETWORK_REQUIRED_NODES_COLUMNS: NodesColumnId[] = ['NodeId'];

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
