import {
    useNodesHandlerHasWorkingClusterNetworkStats,
    useViewerNodesHandlerHasNetworkStats,
} from '../../store/reducers/capabilities/hooks';
import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {useSetting} from '../../store/reducers/settings/useSetting';

export function useShouldShowDatabaseNetworkTable() {
    const viewerNodesHasNetworkStats = useViewerNodesHandlerHasNetworkStats();
    const {value: networkTableEnabled} = useSetting(SETTING_KEYS.ENABLE_NETWORK_TABLE);

    return Boolean(viewerNodesHasNetworkStats && networkTableEnabled);
}

export function useShouldShowClusterNetworkTable() {
    const nodesHasWorkingClusterNetworkStats = useNodesHandlerHasWorkingClusterNetworkStats();
    const {value: networkTableEnabled} = useSetting(SETTING_KEYS.ENABLE_NETWORK_TABLE);

    return Boolean(nodesHasWorkingClusterNetworkStats && networkTableEnabled);
}
