import block from 'bem-cn-lite';

import {ClipboardButton} from '@gravity-ui/uikit';
import {MonitoringButton} from '../../../components/MonitoringButton/MonitoringButton';

import type {ETenantType} from '../../../types/api/tenant';
import type {
    AdditionalClusterProps,
    AdditionalTenantsProps,
    AdditionalVersionsProps,
} from '../../../types/additionalProps';
import type Cluster from '../../Cluster/Cluster';
import type {MetaClusterVersion} from '../../../types/api/clusters';
import type {GetMonitoringLink, GetMonitoringClusterLink} from '../../../utils/monitoring';

import {getVersionColors, getVersionMap} from '../../../utils/clusterVersionColors';
import {removeViewerPathname, getCleanBalancerValue} from '../../../utils/parseBalancer';
import {getBackendFromNodeHost} from '../../../utils/prepareBackend';
import {useClusterData} from '../useClusterData';

import './InternalCluster.scss';

const b = block('internal-cluster');

const getAdditionalBalancerInfo = (balancer: string) => {
    const cleanedValue = getCleanBalancerValue(balancer);

    return {
        label: 'Balancer',
        value: (
            <div className={b('balancer')}>
                {cleanedValue}
                <ClipboardButton text={cleanedValue} size={14} className={b('clipboard-button')} />
            </div>
        ),
    };
};

const getAdditionalClusterProps = (
    monitoring: string | undefined,
    balancer: string | undefined,
    getMonitoringClusterLink?: GetMonitoringClusterLink,
) => {
    const additionalClusterProps: AdditionalClusterProps = {};

    if (monitoring && getMonitoringClusterLink) {
        const clusterLink = getMonitoringClusterLink(monitoring);

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

    additionalTenantsProps.prepareTenantBackend = (nodeHost: string | undefined) => {
        // Proxy received from balancer value, so it's necessary
        if (!balancer) {
            return undefined;
        }

        if (useClusterBalancerAsBackend) {
            return removeViewerPathname(balancer);
        }

        if (!nodeHost) {
            return undefined;
        }

        return getBackendFromNodeHost(nodeHost, balancer);
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

interface InternalClusterProps {
    component: typeof Cluster;
    getMonitoringLink?: GetMonitoringLink;
    getMonitoringClusterLink?: GetMonitoringClusterLink;
}
export function InternalCluster({
    component: ClusterComponent,
    getMonitoringLink,
    getMonitoringClusterLink,
}: InternalClusterProps) {
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
