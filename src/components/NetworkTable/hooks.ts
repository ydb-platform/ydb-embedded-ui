import {
    useNodesHandlerHasWorkingClusterNetworkStats,
    useViewerNodesHandlerHasNetworkStats,
} from '../../store/reducers/capabilities/hooks';
import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {useSetting} from '../../utils/hooks';

export function useShouldShowDatabaseNetworkTable() {
    const viewerNodesHasNetworkStats = useViewerNodesHandlerHasNetworkStats();
    const [networkTableEnabled] = useSetting(SETTING_KEYS.ENABLE_NETWORK_TABLE);

    return Boolean(viewerNodesHasNetworkStats && networkTableEnabled);
}

export function useShouldShowClusterNetworkTable() {
    const nodesHasWorkingClusterNetworkStats = useNodesHandlerHasWorkingClusterNetworkStats();
    const [networkTableEnabled] = useSetting(SETTING_KEYS.ENABLE_NETWORK_TABLE);

    return Boolean(nodesHasWorkingClusterNetworkStats && networkTableEnabled);
}
