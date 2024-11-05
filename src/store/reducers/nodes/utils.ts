import type {TNodesInfo} from '../../../types/api/nodes';
import {generateEvaluator} from '../../../utils/generateEvaluator';
import {prepareNodeSystemState} from '../../../utils/nodes';

import type {NodesGroup, NodesHandledResponse} from './types';

export const prepareNodesData = (data: TNodesInfo): NodesHandledResponse => {
    const rawNodes = data.Nodes || [];

    const preparedNodes = rawNodes.map((node) => {
        return {
            ...prepareNodeSystemState(node.SystemState),
            Tablets: node.Tablets,
            NodeId: node.NodeId,
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

export const getLoadSeverityForNode = generateEvaluator(60, 80, ['success', 'warning', 'danger']);
