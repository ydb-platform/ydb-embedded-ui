import type {
    NodesHandledResponse,
    NodesPreparedEntity,
} from '../../../../../store/reducers/nodes/types';
import type {TPoolStats} from '../../../../../types/api/nodes';
import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../../utils/constants';

function getNodeMaxPoolUsage(pools: TPoolStats[] = []) {
    const usages = pools.map((pool) => pool.Usage || 0);

    return Math.max(...usages, 0);
}

export function prepareTopNodesByCPU(data?: NodesHandledResponse): NodesPreparedEntity[] {
    const nodes = data?.Nodes?.slice() || [];

    nodes.sort((node1, node2) => {
        const node1SortValue = getNodeMaxPoolUsage(node1.PoolStats);
        const node2SortValue = getNodeMaxPoolUsage(node2.PoolStats);

        return node2SortValue - node1SortValue;
    });

    return nodes.slice(0, TENANT_OVERVIEW_TABLES_LIMIT);
}

export function prepareTopNodesByLoad(data?: NodesHandledResponse): NodesPreparedEntity[] {
    const nodes = data?.Nodes?.slice() || [];

    nodes.sort((node1, node2) => {
        const node1SortValue = node1.LoadAverage?.[0] || 0;
        const node2SortValue = node2.LoadAverage?.[0] || 0;

        return node2SortValue - node1SortValue;
    });

    return nodes.slice(0, TENANT_OVERVIEW_TABLES_LIMIT);
}
