import type {TNetNodePeerInfo} from '../../../../types/api/netInfo';

// determine how many nodes have status Connected "true"
export const getConnectedNodesCount = (peers: TNetNodePeerInfo[] | undefined) => {
    return peers?.reduce((acc, item) => (item.Connected ? acc + 1 : acc), 0);
};
