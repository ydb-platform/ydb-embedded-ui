import type {TNodesInfo} from '../../../types/api/nodes';
import {prepareNodeSystemState} from '../../../utils/nodes';

import type {NodesGroup, NodesHandledResponse} from './types';

export const prepareNodesData = (data: TNodesInfo): NodesHandledResponse => {
    const rawNodes = data.Nodes || [];

    const preparedNodes = rawNodes.map((node) => {
        const {SystemState, ...restNodeParams} = node;

        return {
            ...restNodeParams,
            ...prepareNodeSystemState(SystemState),
        };
    });

    const preparedGroups = data.NodeGroups?.map(({GroupName, NodeCount}) => {
        if (GroupName && NodeCount) {
            return {
                name: GroupName,
                count: Number(NodeCount),
            };
        }
        return undefined;
    }).filter((group): group is NodesGroup => Boolean(group));

    return {
        Nodes: preparedNodes,
        NodeGroups: preparedGroups,
        TotalNodes: Number(data.TotalNodes) || preparedNodes.length,
        FoundNodes: Number(data.FoundNodes),
    };
};
