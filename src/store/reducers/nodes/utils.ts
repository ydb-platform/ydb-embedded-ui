import type {TComputeInfo} from '../../../types/api/compute';
import type {TNodesInfo} from '../../../types/api/nodes';
import {calcUptime} from '../../../utils';

import type {NodesHandledResponse, NodesPreparedEntity} from './types';

export const prepareComputeNodesData = (data: TComputeInfo): NodesHandledResponse => {
    const preparedNodes: NodesPreparedEntity[] = [];

    if (data.Tenants) {
        for (const tenant of data.Tenants) {
            tenant.Nodes?.forEach((node) => {
                preparedNodes.push({
                    ...node,
                    TenantName: tenant.Name,
                    SystemState: node?.Overall,
                    Uptime: calcUptime(node?.StartTime),
                });
            });
        }
    }

    return {
        Nodes: preparedNodes,
        TotalNodes: preparedNodes.length,
    };
};

export const prepareNodesData = (data: TNodesInfo): NodesHandledResponse => {
    const rawNodes = data.Nodes || [];

    const preparedNodes = rawNodes.map((node) => {
        return {
            ...node.SystemState,
            Tablets: node.Tablets,
            NodeId: node.NodeId,
            Uptime: calcUptime(node.SystemState?.StartTime),
            TenantName: node.SystemState?.Tenants?.[0],
        };
    });

    return {
        Nodes: preparedNodes,
        TotalNodes: Number(data.TotalNodes) ?? preparedNodes.length,
    };
};
