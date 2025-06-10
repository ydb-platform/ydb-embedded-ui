import {ClipboardButton} from '@gravity-ui/uikit';

import {useClusterBaseInfo} from '../../../store/reducers/cluster/cluster';
import type {AdditionalClusterProps} from '../../../types/additionalProps';
import type {GetClusterLinks, GetDatabaseLinks} from '../../../uiFactory/types';
import {cn} from '../../../utils/cn';
import {useAdditionalNodesProps} from '../../../utils/hooks/useAdditionalNodesProps';
import type {GetLogsLink} from '../../../utils/logs';
import type {GetMonitoringClusterLink, GetMonitoringLink} from '../../../utils/monitoring';
import {getCleanBalancerValue} from '../../../utils/parseBalancer';
import type {Cluster} from '../../Cluster/Cluster';
import {useAdditionalTenantsProps} from '../utils/useAdditionalTenantsProps';

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
    getMonitoringClusterLink?: GetMonitoringClusterLink;
    getClusterLinks?: GetClusterLinks;
}

const useAdditionalClusterProps = ({
    getMonitoringClusterLink,
    getClusterLinks,
}: GetAdditionalClusterProps) => {
    const clusterInfo = useClusterBaseInfo();
    const {name: clusterName, balancer, monitoring} = clusterInfo;

    const additionalClusterProps: AdditionalClusterProps = {};
    additionalClusterProps.links = [];
    if (monitoring && getMonitoringClusterLink) {
        const clusterLink = getMonitoringClusterLink(monitoring, clusterName);

        if (clusterLink) {
            additionalClusterProps.links.push({title: 'Monitoring', url: clusterLink});
        }
    }

    if (getClusterLinks) {
        const clusterLinks = getClusterLinks({clusterInfo});
        additionalClusterProps.links.push(...clusterLinks);
    }

    if (balancer) {
        additionalClusterProps.info = [getAdditionalBalancerInfo(balancer)];
    }

    return additionalClusterProps;
};

interface ExtendedClusterProps {
    component: typeof Cluster;
    getMonitoringLink?: GetMonitoringLink;
    getMonitoringClusterLink?: GetMonitoringClusterLink;
    getLogsLink?: GetLogsLink;
    getDatabaseLinks?: GetDatabaseLinks;
    getClusterLinks?: GetClusterLinks;
}
export function ExtendedCluster({
    component: ClusterComponent,
    getMonitoringLink,
    getMonitoringClusterLink,
    getLogsLink,
    getDatabaseLinks,
    getClusterLinks,
}: ExtendedClusterProps) {
    const additionalNodesProps = useAdditionalNodesProps();

    return (
        <div className={b()}>
            <ClusterComponent
                additionalClusterProps={useAdditionalClusterProps({
                    getMonitoringClusterLink,
                    getClusterLinks,
                })}
                additionalTenantsProps={useAdditionalTenantsProps({
                    getMonitoringLink,
                    getLogsLink,
                    getDatabaseLinks,
                })}
                additionalNodesProps={additionalNodesProps}
            />
        </div>
    );
}
