import type {TComputeInfo} from '../../../../types/api/compute';
import {generateEvaluator} from '../../../../utils/generateEvaluator';
import {prepareComputeNodes} from '../../nodes/utils';
import type {TopNodesHandledResponse} from './types';

export const prepareTopComputeNodesData = (data: TComputeInfo): TopNodesHandledResponse => {
    const preparedNodes = prepareComputeNodes(data.Nodes, data.Tenants);

    let sortedNodes = preparedNodes;

    if (!data.Nodes) {
        sortedNodes = preparedNodes.sort((a, b) => Number(b.LoadAverage) - Number(a.LoadAverage));
    }

    return {
        Nodes: sortedNodes,
    };
};

export const getLoadSeverityForNode = generateEvaluator(60, 80, ['success', 'warning', 'danger']);
