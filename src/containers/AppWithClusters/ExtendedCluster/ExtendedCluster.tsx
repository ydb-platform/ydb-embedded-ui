import {ClipboardButton} from '@gravity-ui/uikit';

import {useClusterBaseInfo} from '../../../store/reducers/cluster/cluster';
import type {
    AdditionalClusterProps,
    AdditionalTenantsProps,
    NodeAddress,
} from '../../../types/additionalProps';
import type {ETenantType} from '../../../types/api/tenant';
import {cn} from '../../../utils/cn';
import {USE_CLUSTER_BALANCER_AS_BACKEND_KEY} from '../../../utils/constants';
import {useSetting} from '../../../utils/hooks';
import {useAdditionalNodesProps} from '../../../utils/hooks/useAdditionalNodesProps';
import type {
    GetLogsLink,
    GetMonitoringClusterLink,
    GetMonitoringLink,
} from '../../../utils/monitoring';
import {getCleanBalancerValue, removeViewerPathname} from '../../../utils/parseBalancer';
import {getBackendFromNodeHost, getBackendFromRawNodeData} from '../../../utils/prepareBackend';
import type {Cluster} from '../../Cluster/Cluster';

import './ExtendedCluster.scss';

const b = cn('extended-cluster');

const getAdditionalBalancerInfo = (balancer: string) => {
    const cleanedValue = getCleanBalancerValue(balancer);

    return {
        label: 'Balancer',
        value: (
            <div className={b('balancer')}>
                {cleanedValue}
                <ClipboardButton text={cleanedValue} size="s" className={b('clipboard-button')} />
            </div>
        ),
    };
};

const getAdditionalClusterProps = (
    clusterName: string | undefined,
    monitoring: string | undefined,
    balancer: string | undefined,
    getMonitoringClusterLink?: GetMonitoringClusterLink,
) => {
    const additionalClusterProps: AdditionalClusterProps = {};

    if (monitoring && getMonitoringClusterLink) {
        const clusterLink = getMonitoringClusterLink(monitoring, clusterName);

        if (clusterLink) {
            additionalClusterProps.links = [{title: 'Monitoring', url: clusterLink}];
        }
    }

    if (balancer) {
        additionalClusterProps.info = [getAdditionalBalancerInfo(balancer)];
    }

    return additionalClusterProps;
};

const getAdditionalTenantsProps = (
    clusterName: string | undefined,
    monitoring: string | undefined,
    balancer: string | undefined,
    useClusterBalancerAsBackend: boolean | undefined,
    getMonitoringLink?: GetMonitoringLink,
    getLogsLink?: GetLogsLink,
) => {
    const additionalTenantsProps: AdditionalTenantsProps = {};

    additionalTenantsProps.prepareTenantBackend = (
        nodeHostOrAddress: string | NodeAddress | undefined,
    ) => {
        // Proxy received from balancer value, so it's necessary
        if (!balancer) {
            return undefined;
        }

        if (useClusterBalancerAsBackend) {
            return removeViewerPathname(balancer);
        }

        if (!nodeHostOrAddress) {
            return undefined;
        }

        if (typeof nodeHostOrAddress === 'string') {
            return getBackendFromNodeHost(nodeHostOrAddress, balancer);
        }

        return getBackendFromRawNodeData(nodeHostOrAddress, balancer, true) ?? undefined;
    };

    if (monitoring && getMonitoringLink) {
        additionalTenantsProps.getMonitoringLink = (dbName?: string, dbType?: ETenantType) => {
            if (dbName && dbType) {
                return getMonitoringLink({monitoring, dbName, dbType, clusterName});
            }

            return null;
        };
    }

    if (monitoring && getLogsLink) {
        additionalTenantsProps.getLogsLink = (dbName?: string) => {
            if (dbName) {
                return getLogsLink({
                    dbName,
                    clusterName,
                    monitoring,
                });
            }

            return null;
        };
    }

    return additionalTenantsProps;
};

interface ExtendedClusterProps {
    component: typeof Cluster;
    getMonitoringLink?: GetMonitoringLink;
    getMonitoringClusterLink?: GetMonitoringClusterLink;
    getLogsLink?: GetLogsLink;
}
export function ExtendedCluster({
    component: ClusterComponent,
    getMonitoringLink,
    getMonitoringClusterLink,
    getLogsLink,
}: ExtendedClusterProps) {
    const additionalNodesProps = useAdditionalNodesProps();
    const {name, balancer, monitoring} = useClusterBaseInfo();

    const [useClusterBalancerAsBackend] = useSetting<boolean>(USE_CLUSTER_BALANCER_AS_BACKEND_KEY);

    return (
        <div className={b()}>
            <ClusterComponent
                additionalClusterProps={getAdditionalClusterProps(
                    name,
                    monitoring,
                    balancer,
                    getMonitoringClusterLink,
                )}
                additionalTenantsProps={getAdditionalTenantsProps(
                    name,
                    monitoring,
                    balancer,
                    useClusterBalancerAsBackend,
                    getMonitoringLink,
                    getLogsLink,
                )}
                additionalNodesProps={additionalNodesProps}
            />
        </div>
    );
}
