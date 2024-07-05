import type {TComputeInfo, TComputeNodeInfo, TComputeTenantInfo} from '../../../types/api/compute';
import type {TNodesInfo} from '../../../types/api/nodes';
import {calcUptime} from '../../../utils/dataFormatters/dataFormatters';
import {generateEvaluator} from '../../../utils/generateEvaluator';
import {calculateLoadAveragePercents, prepareNodeSystemState} from '../../../utils/nodes';

import type {NodesHandledResponse, NodesPreparedEntity} from './types';

const prepareComputeNode = (node: TComputeNodeInfo, tenantName?: string): NodesPreparedEntity => {
    return {
        ...node,
        // v2 response has tenant name, v1 - doesn't
        TenantName: node.Tenant ?? tenantName,
        SystemState: node?.Overall,
        Uptime: calcUptime(node?.StartTime),
        LoadAveragePercents: calculateLoadAveragePercents(node),

        DC: node.DataCenter,
    };
};

export const prepareComputeNodes = (nodes?: TComputeNodeInfo[], tenants?: TComputeTenantInfo[]) => {
    const preparedNodes: NodesPreparedEntity[] = [];

    // First try to parse v2 response in case backend supports it
    // Else parse v1 response

    if (nodes) {
        nodes.forEach((node) => {
            preparedNodes.push(prepareComputeNode(node));
        });
    } else if (tenants) {
        for (const tenant of tenants) {
            tenant.Nodes?.forEach((node) => {
                preparedNodes.push(prepareComputeNode(node, tenant.Name));
            });
        }
    }

    return preparedNodes;
};

export const prepareComputeNodesData = (data: TComputeInfo): NodesHandledResponse => {
    const preparedNodes = prepareComputeNodes(data.Nodes, data.Tenants);

    return {
        Nodes: preparedNodes,
        TotalNodes: Number(data.TotalNodes) || preparedNodes.length,
        FoundNodes: Number(data.FoundNodes),
    };
};

export const prepareNodesData = (data: TNodesInfo): NodesHandledResponse => {
    const rawNodes = data.Nodes || [];

    const preparedNodes = rawNodes.map((node) => {
        // 0 limit means that limit is not set, so it should be undefined
        const sharedCacheLimit = Number(node.SystemState.SharedCacheStats?.LimitBytes) || undefined;

        return {
            ...prepareNodeSystemState(node.SystemState),
            Tablets: node.Tablets,
            NodeId: node.NodeId,
            TenantName: node.SystemState?.Tenants?.[0],
            SharedCacheUsed: node.SystemState.SharedCacheStats?.UsedBytes,
            SharedCacheLimit: sharedCacheLimit,
        };
    });

    return {
        Nodes: preparedNodes,
        TotalNodes: Number(data.TotalNodes) || preparedNodes.length,
        FoundNodes: Number(data.FoundNodes),
    };
};

export const getLoadSeverityForNode = generateEvaluator(60, 80, ['success', 'warning', 'danger']);
