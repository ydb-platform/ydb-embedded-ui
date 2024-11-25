import type {SelectOption} from '@gravity-ui/uikit';

import {getNodesGroupByFieldTitle} from '../../../components/nodesColumns/constants';
import type {NodesColumnId} from '../../../components/nodesColumns/constants';
import type {NodesGroupByField} from '../../../types/api/nodes';

export const NODES_TABLE_SELECTED_COLUMNS_LS_KEY = 'nodesTableSelectedColumns';

export const DEFAULT_NODES_COLUMNS: NodesColumnId[] = [
    'NodeId',
    'Host',
    'Uptime',
    'CPU',
    'RAM',
    'Version',
    'Tablets',
];

export const REQUIRED_NODES_COLUMNS: NodesColumnId[] = ['NodeId'];

export const ALL_NODES_GROUP_BY_PARAMS = [
    'SystemState',
    'Host',
    'DC',
    'Rack',
    'Database',
    'Version',
    'Uptime',
] as const satisfies NodesGroupByField[];

function prepareGroupByParams(
    groupByParams: NodesGroupByField[],
    withSystemStateGroupBy?: boolean,
) {
    if (!withSystemStateGroupBy) {
        return groupByParams.filter((param) => param !== 'SystemState');
    }

    return groupByParams;
}

export function getNodesGroupByOptions(
    groupByParams: NodesGroupByField[],
    withSystemStateGroupBy?: boolean,
): SelectOption[] {
    return prepareGroupByParams(groupByParams, withSystemStateGroupBy).map((param) => {
        return {
            value: param,
            content: getNodesGroupByFieldTitle(param),
        };
    });
}

export function parseNodesGroupByParam(
    paramToParse: unknown,
    groupByParams: NodesGroupByField[],
    withSystemStateGroupBy?: boolean,
): NodesGroupByField | undefined {
    const availableParams = prepareGroupByParams(groupByParams, withSystemStateGroupBy);

    return availableParams.find((groupByField) => groupByField === paramToParse);
}
