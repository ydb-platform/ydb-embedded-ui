import {isNil} from 'lodash';

import {useClusterBaseInfo} from '../../../store/reducers/cluster/cluster';
import type {AdditionalTenantsProps} from '../../../types/additionalProps';
import type {ETenantType} from '../../../types/api/tenant';
import type {GetDatabaseLinks} from '../../../uiFactory/types';
import {USE_CLUSTER_BALANCER_AS_BACKEND_KEY} from '../../../utils/constants';
import {useSetting} from '../../../utils/hooks';
import type {GetLogsLink} from '../../../utils/logs';
import type {GetMonitoringLink} from '../../../utils/monitoring';
import {prepareBackendFromBalancer} from '../../../utils/parseBalancer';
import {getBackendFromBalancerAndNodeId} from '../../../utils/prepareBackend';

interface GetAdditionalTenantsProps {
    getMonitoringLink?: GetMonitoringLink;
    getLogsLink?: GetLogsLink;
    getDatabaseLinks?: GetDatabaseLinks;
}
export function useAdditionalTenantsProps({
    getMonitoringLink,
    getLogsLink,
    getDatabaseLinks,
}: GetAdditionalTenantsProps) {
    const clusterInfo = useClusterBaseInfo();
    const [useClusterBalancerAsBackend] = useSetting<boolean>(USE_CLUSTER_BALANCER_AS_BACKEND_KEY);

    const {balancer, monitoring, logging, name: clusterName} = clusterInfo;

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
                return getMonitoringLink({monitoring, clusterName, dbName, dbType});
            }

            return null;
        };
    }

    if (logging && getLogsLink) {
        additionalTenantsProps.getLogsLink = (dbName?: string) => {
            if (dbName) {
                return getLogsLink({logging, dbName});
            }

            return null;
        };
    }

    if (getDatabaseLinks) {
        additionalTenantsProps.getLinks = (dbName?: string, dbType?: ETenantType) => {
            if (dbName && dbType) {
                return getDatabaseLinks({clusterInfo, dbName, dbType});
            }
            return [];
        };
    }

    return additionalTenantsProps;
}
