import type {NodesColumnId} from '../../../components/nodesColumns/constants';

export const NODES_TABLE_SELECTED_COLUMNS_LS_KEY = 'nodesTableSelectedColumns';

export const DEFAULT_NODES_COLUMNS: NodesColumnId[] = [
    'NodeId',
    'Host',
    'DC',
    'Rack',
    'Version',
    'Uptime',
    'Memory',
    'Pools',
    'LoadAverage',
    'Tablets',
];

export const REQUIRED_NODES_COLUMNS: NodesColumnId[] = ['NodeId'];
