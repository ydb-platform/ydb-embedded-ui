import type {TSystemStateInfo} from '../types/api/nodes';
import type {INodesPreparedEntity} from '../types/store/nodes';
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

export interface AdditionalNodesInfo extends Record<string, unknown> {
    getNodeRef?: Function;
}
