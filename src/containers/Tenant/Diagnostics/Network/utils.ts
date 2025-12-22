import type {TNetNodeInfo, TNetNodePeerInfo} from '../../../../types/api/netInfo';

// determine how many nodes have status Connected "true"
export const getConnectedNodesCount = (peers: TNetNodePeerInfo[] | undefined) => {
    return peers?.reduce((acc, item) => (item.Connected ? acc + 1 : acc), 0);
};

export function groupNodesByField<T extends Pick<TNetNodeInfo, 'NodeType' | 'Rack'>>(
    nodes: T[],
    field: 'NodeType' | 'Rack',
) {
    return nodes.reduce<Record<string, T[]>>((acc, node) => {
        if (acc[node[field]]) {
            acc[node[field]].push(node);
        } else {
            acc[node[field]] = [node];
        }
        return acc;
    }, {});
}
