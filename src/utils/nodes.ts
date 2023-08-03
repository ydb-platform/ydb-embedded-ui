import type {TSystemStateInfo} from '../types/api/nodes';
import type {TNodeInfo} from '../types/api/nodesList';
import type {NodesPreparedEntity} from '../store/reducers/nodes/types';
import type {NodesMap} from '../types/store/nodesList';
import type {ValueOf} from '../types/common';
import {EFlag} from '../types/api/enums';

export enum NodesUptimeFilterValues {
    'All' = 'All',
    'SmallUptime' = 'SmallUptime',
}

export const NodesUptimeFilterTitles = {
    [NodesUptimeFilterValues.All]: 'All',
    [NodesUptimeFilterValues.SmallUptime]: 'Uptime < 1h',
};

export const isUnavailableNode = (node: NodesPreparedEntity | TSystemStateInfo) =>
    !node.SystemState || node.SystemState === EFlag.Grey;

export type NodeAddress = Pick<TSystemStateInfo, 'Host' | 'Endpoints'>;

export interface AdditionalNodesInfo extends Record<string, unknown> {
    getNodeRef?: (node?: NodeAddress) => string | null;
}

export const prepareNodesMap = (nodesList?: TNodeInfo[]) => {
    return nodesList?.reduce<NodesMap>((nodesMap, node) => {
        if (node.Id && node.Host) {
            nodesMap.set(Number(node.Id), node.Host);
        }
        return nodesMap;
    }, new Map());
};

/**
 * Values to sort /compute v2 and /nodes responses
 *
 * For actual values go to:\
 * /nodes: https://github.com/ydb-platform/ydb/blob/main/ydb/core/viewer/json_nodes.h\
 * /compute: https://github.com/ydb-platform/ydb/blob/main/ydb/core/viewer/json_compute.h
 */
export const NODES_SORT_VALUES = {
    NodeId: 'NodeId',
    Host: 'Host',
    DC: 'DC',
    Rack: 'Rack',
    Version: 'Version',
    Uptime: 'Uptime',
    Memory: 'Memory',
    CPU: 'CPU',
    LoadAverage: 'LoadAverage',
} as const;

export type NodesSortValue = ValueOf<typeof NODES_SORT_VALUES>;

export const isSortableNodesProperty = (value: string): value is NodesSortValue =>
    Object.values(NODES_SORT_VALUES).includes(value as NodesSortValue);
