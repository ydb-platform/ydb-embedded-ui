import {useViewerNodesHandlerHasNetworkStats} from '../../store/reducers/capabilities/hooks';
import {ENABLE_NETWORK_TABLE_KEY} from '../../utils/constants';
import {useSetting} from '../../utils/hooks';

export function useShouldShowNetworkTable() {
    const viewerNodesHasNetworkStats = useViewerNodesHandlerHasNetworkStats();
    const [networkTableEnabled] = useSetting(ENABLE_NETWORK_TABLE_KEY);

    return Boolean(viewerNodesHasNetworkStats && networkTableEnabled);
}
