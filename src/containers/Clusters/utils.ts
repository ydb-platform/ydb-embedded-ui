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
    } = row;

    if (useEmbeddedUi && backend) {
        return createDeveloperUIMonitoringPageHref(backend);
    }

    return getClusterPath(
        {
            activeTab,
            environment: settings?.auth_service,
        },
        {backend, clusterName},
        {withBasename: true},
        clusterDomain,
    );
}
