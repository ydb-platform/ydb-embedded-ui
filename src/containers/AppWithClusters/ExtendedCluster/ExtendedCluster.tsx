import {ClipboardButton} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {useClusterBaseInfo} from '../../../store/reducers/cluster/cluster';
import type {AdditionalClusterProps, AdditionalTenantsProps} from '../../../types/additionalProps';
import type {ETenantType} from '../../../types/api/tenant';
import {cn} from '../../../utils/cn';
import {USE_CLUSTER_BALANCER_AS_BACKEND_KEY} from '../../../utils/constants';
import {useSetting} from '../../../utils/hooks';
import {useAdditionalNodesProps} from '../../../utils/hooks/useAdditionalNodesProps';
import type {GetLogsLink} from '../../../utils/logs';
import type {GetMonitoringClusterLink, GetMonitoringLink} from '../../../utils/monitoring';
import {getCleanBalancerValue, prepareBackendFromBalancer} from '../../../utils/parseBalancer';
import {getBackendFromBalancerAndNodeId} from '../../../utils/prepareBackend';
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

interface GetAdditionalClusterProps {
    clusterName: string | undefined;
    monitoring: string | undefined;
    balancer: string | undefined;
    getMonitoringClusterLink?: GetMonitoringClusterLink;
}

const getAdditionalClusterProps = ({
    clusterName,
    monitoring,
    balancer,
    getMonitoringClusterLink,
}: GetAdditionalClusterProps) => {
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

interface GetAdditionalTenantsProps {
    clusterName: string | undefined;
    monitoring: string | undefined;
    balancer: string | undefined;
    logging: string | undefined;
    useClusterBalancerAsBackend: boolean | undefined;
    getMonitoringLink?: GetMonitoringLink;
    getLogsLink?: GetLogsLink;
}

const getAdditionalTenantsProps = ({
    clusterName,
    monitoring,
    balancer,
    logging,
    useClusterBalancerAsBackend,
    getMonitoringLink,
    getLogsLink,
}: GetAdditionalTenantsProps) => {
    const additionalTenantsProps: AdditionalTenantsProps = {};

    additionalTenantsProps.prepareTenantBackend = (nodeId) => {
        // Balancer value is used to create path, so it's necessary
        if (!balancer) {
            return undefined;
        }

        if (useClusterBalancerAsBackend) {
            return prepareBackendFromBalancer(balancer);
        }

        if (isNil(nodeId)) {
            return undefined;
        }

        return getBackendFromBalancerAndNodeId(nodeId, balancer) ?? undefined;
    };

    if (monitoring && getMonitoringLink) {
        additionalTenantsProps.getMonitoringLink = (dbName?: string, dbType?: ETenantType) => {
            if (dbName && dbType) {
                return getMonitoringLink({monitoring, dbName, dbType, clusterName});
            }

            return null;
        };
    }

    if (logging && getLogsLink) {
        additionalTenantsProps.getLogsLink = (dbName?: string) => {
            if (dbName) {
                return getLogsLink({
                    dbName,
                    logging,
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
    const {name, balancer, monitoring, logging} = useClusterBaseInfo();

    const [useClusterBalancerAsBackend] = useSetting<boolean>(USE_CLUSTER_BALANCER_AS_BACKEND_KEY);

    return (
        <div className={b()}>
            <ClusterComponent
                additionalClusterProps={getAdditionalClusterProps({
                    clusterName: name,
                    monitoring,
                    balancer,
                    getMonitoringClusterLink,
                })}
                additionalTenantsProps={getAdditionalTenantsProps({
                    clusterName: name,
                    monitoring,
                    balancer,
                    logging,
                    useClusterBalancerAsBackend,
                    getMonitoringLink,
                    getLogsLink,
                })}
                additionalNodesProps={additionalNodesProps}
            />
        </div>
    );
}
