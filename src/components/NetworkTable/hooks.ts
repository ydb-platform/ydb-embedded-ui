import {
    useNodesHandlerHasWorkingClusterNetworkStats,
    useViewerNodesHandlerHasNetworkStats,
} from '../../store/reducers/capabilities/hooks';
import {ENABLE_NETWORK_TABLE_KEY} from '../../utils/constants';
import {useSetting} from '../../utils/hooks';

export function useShouldShowDatabaseNetworkTable() {
    const viewerNodesHasNetworkStats = useViewerNodesHandlerHasNetworkStats();
    const [networkTableEnabled] = useSetting(ENABLE_NETWORK_TABLE_KEY);

    return Boolean(viewerNodesHasNetworkStats && networkTableEnabled);
}

export function useShouldShowClusterNetworkTable() {
    const nodesHasWorkingClusterNetworkStats = useNodesHandlerHasWorkingClusterNetworkStats();
    const [networkTableEnabled] = useSetting(ENABLE_NETWORK_TABLE_KEY);

    return Boolean(nodesHasWorkingClusterNetworkStats && networkTableEnabled);
}
