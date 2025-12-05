import {getClusterPath} from '../../routes';
import type {PreparedCluster} from '../../store/reducers/clusters/types';
import {createDeveloperUIMonitoringPageHref} from '../../utils/developerUI/developerUI';
import type {ClusterTab} from '../Cluster/utils';

export function calculateClusterPath(row: PreparedCluster, activeTab?: ClusterTab): string {
    const {
        use_embedded_ui: useEmbeddedUi,
        preparedBackend: backend,
        name: clusterName,
        clusterDomain,
        settings,
        clusterExternalName,
    } = row;

    if (useEmbeddedUi && backend) {
        return createDeveloperUIMonitoringPageHref(backend);
    }

    return getClusterPath(
        {
            activeTab,
            environment: clusterDomain ? undefined : settings?.auth_service,
        },
        {
            backend: clusterDomain ? undefined : backend,
            clusterName: clusterDomain && clusterExternalName ? clusterExternalName : clusterName,
        },
        {withBasename: true},
        clusterDomain,
    );
}
