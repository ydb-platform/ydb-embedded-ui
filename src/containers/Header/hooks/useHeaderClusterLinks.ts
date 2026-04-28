import type {ClusterLinkWithTitle} from '../../../types/additionalProps';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {useClusterLinks} from '../../../utils/clusterLinks/useClusterLinks';
import {useAdditionalClusterProps} from '../../AppWithClusters/ExtendedCluster/ExtendedCluster';

export function useHeaderClusterLinks(): ClusterLinkWithTitle[] {
    const {links: additionalLinks} = useAdditionalClusterProps({
        getMonitoringClusterLink: uiFactory.getMonitoringClusterLink,
        getClusterLinks: uiFactory.getClusterLinks,
    });

    return useClusterLinks(additionalLinks);
}
