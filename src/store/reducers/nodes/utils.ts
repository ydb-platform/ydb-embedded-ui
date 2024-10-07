import type {TNodesInfo} from '../../../types/api/nodes';
import {generateEvaluator} from '../../../utils/generateEvaluator';
import {prepareNodeSystemState} from '../../../utils/nodes';

import type {NodesHandledResponse} from './types';

export const prepareNodesData = (data: TNodesInfo): NodesHandledResponse => {
    const rawNodes = data.Nodes || [];

    const preparedNodes = rawNodes.map((node) => {
        return {
            ...prepareNodeSystemState(node.SystemState),
            Tablets: node.Tablets,
            NodeId: node.NodeId,
        };
    });

    const preparedGroups = data.NodeGroups?.map((group) => ({
        name: group.GroupName,
        count: group.NodeCount,
    }));

    return {
        Nodes: preparedNodes,
        NodeGroups: preparedGroups,
        TotalNodes: Number(data.TotalNodes) || preparedNodes.length,
        FoundNodes: Number(data.FoundNodes),
    };
};

export const getLoadSeverityForNode = generateEvaluator(60, 80, ['success', 'warning', 'danger']);
