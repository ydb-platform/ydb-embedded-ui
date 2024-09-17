import type {
    NodesHandledResponse,
    NodesPreparedEntity,
} from '../../../../../store/reducers/nodes/types';
import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../../utils/constants';

export function prepareTopNodesByMemory(data?: NodesHandledResponse): NodesPreparedEntity[] {
    const nodes = data?.Nodes?.slice() || [];

    nodes.sort((node1, node2) => {
        const node1SortValue = Number(node1.MemoryUsed) || 0;
        const node2SortValue = Number(node2.MemoryUsed) || 0;

        return node2SortValue - node1SortValue;
    });

    return nodes.slice(0, TENANT_OVERVIEW_TABLES_LIMIT);
}
