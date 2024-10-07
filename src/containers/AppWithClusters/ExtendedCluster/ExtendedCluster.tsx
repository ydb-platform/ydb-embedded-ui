import {ClipboardButton} from '@gravity-ui/uikit';

import {MonitoringButton} from '../../../components/MonitoringButton/MonitoringButton';
import type {
    AdditionalClusterProps,
    AdditionalTenantsProps,
    AdditionalVersionsProps,
    NodeAddress,
} from '../../../types/additionalProps';
import type {MetaClusterVersion} from '../../../types/api/meta';
import type {ETenantType} from '../../../types/api/tenant';
import {getVersionColors, getVersionMap} from '../../../utils/clusterVersionColors';
import {cn} from '../../../utils/cn';
import type {GetMonitoringClusterLink, GetMonitoringLink} from '../../../utils/monitoring';
import {getCleanBalancerValue, removeViewerPathname} from '../../../utils/parseBalancer';
import {getBackendFromNodeHost, getBackendFromRawNodeData} from '../../../utils/prepareBackend';
import type {Cluster} from '../../Cluster/Cluster';
import {useClusterData} from '../useClusterData';

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

const getAdditionalVersionsProps = (
    versions: MetaClusterVersion[] = [],
): AdditionalVersionsProps => {
    return {
        getVersionToColorMap: () => {
            return getVersionColors(getVersionMap(versions));
        },
    };
};

const getAdditionalTenantsProps = (
    clusterName: string | undefined,
    monitoring: string | undefined,
    balancer: string | undefined,
    useClusterBalancerAsBackend: boolean | undefined,
    getMonitoringLink?: GetMonitoringLink,
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
                const href = getMonitoringLink({monitoring, dbName, dbType, clusterName});
                return <MonitoringButton href={href} />;
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
}
export function ExtendedCluster({
    component: ClusterComponent,
    getMonitoringLink,
    getMonitoringClusterLink,
}: ExtendedClusterProps) {
    const {
        monitoring,
        balancer,
        versions,
        cluster,
        useClusterBalancerAsBackend,
        additionalNodesProps,
    } = useClusterData();

    return (
        <div className={b()}>
            <ClusterComponent
                additionalClusterProps={getAdditionalClusterProps(
                    cluster?.Name,
                    monitoring,
                    balancer,
                    getMonitoringClusterLink,
                )}
                additionalVersionsProps={getAdditionalVersionsProps(versions)}
                additionalTenantsProps={getAdditionalTenantsProps(
                    cluster?.Name,
                    monitoring,
                    balancer,
                    useClusterBalancerAsBackend,
                    getMonitoringLink,
                )}
                additionalNodesProps={additionalNodesProps}
            />
        </div>
    );
}
