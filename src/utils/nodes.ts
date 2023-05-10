import type {TSystemStateInfo} from '../types/api/nodes';
import type {TNodeInfo} from '../types/api/nodesList';
import type {INodesPreparedEntity} from '../types/store/nodes';
import type {NodesMap} from '../types/store/nodesList';
import {EFlag} from '../types/api/enums';

export enum NodesUptimeFilterValues {
    'All' = 'All',
    'SmallUptime' = 'SmallUptime',
}

export const NodesUptimeFilterTitles = {
    [NodesUptimeFilterValues.All]: 'All',
    [NodesUptimeFilterValues.SmallUptime]: 'Uptime < 1h',
};

export const isUnavailableNode = (node: INodesPreparedEntity | TSystemStateInfo) =>
    !node.SystemState || node.SystemState === EFlag.Grey;

export type NodeAddress = Pick<TSystemStateInfo, 'Host' | 'Endpoints'>;

export interface AdditionalNodesInfo extends Record<string, unknown> {
    getNodeRef?: (node?: NodeAddress) => string;
}

export const prepareNodesMap = (nodesList?: TNodeInfo[]) => {
    return nodesList?.reduce<NodesMap>((nodesMap, node) => {
        if (node.Id && node.Host) {
            nodesMap.set(Number(node.Id), node.Host);
        }
        return nodesMap;
    }, new Map());
};
