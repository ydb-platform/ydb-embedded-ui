import type {SelectOption} from '@gravity-ui/uikit';

import {NODES_COLUMNS_TITLES} from '../../../components/nodesColumns/constants';
import type {NodesColumnId} from '../../../components/nodesColumns/constants';
import type {NodesGroupByField} from '../../../types/api/nodes';

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

const ALL_NODES_GROUP_BY_PARAMS = [
    'SystemState',
    'Host',
    'DC',
    'Rack',
    'Database',
    'Version',
    'Uptime',
    'Missing',
    'DiskSpaceUsage',
] as const satisfies NodesGroupByField[];

function getAvailableNodesGroupByParams(withSystemStateGroupBy?: boolean) {
    if (!withSystemStateGroupBy) {
        return ALL_NODES_GROUP_BY_PARAMS.filter((param) => param !== 'SystemState');
    }

    return ALL_NODES_GROUP_BY_PARAMS;
}

export function getNodesGroupByOptions(withSystemStateGroupBy?: boolean): SelectOption[] {
    return getAvailableNodesGroupByParams(withSystemStateGroupBy).map((param) => {
        return {
            value: param,
            content: NODES_COLUMNS_TITLES[param],
        };
    });
}

export function parseNodesGroupByParam(
    paramToParse: unknown,
    withSystemStateGroupBy?: boolean,
): NodesGroupByField | undefined {
    const availableParams = getAvailableNodesGroupByParams(withSystemStateGroupBy);

    return availableParams.find((groupByField) => groupByField === paramToParse);
}
