import {Flex, Text} from '@gravity-ui/uikit';

import {ResponseError} from '../../../components/Errors/ResponseError';
import {Tags} from '../../../components/Tags';
import type {ClusterGroupsStats} from '../../../store/reducers/cluster/types';
import type {TClusterInfo, TClusterInfoV2} from '../../../types/api/cluster';
import type {IResponseError} from '../../../types/api/error';
import {valueIsDefined} from '../../../utils';
import {formatNumber} from '../../../utils/dataFormatters/dataFormatters';
import i18n from '../i18n';

import {ClusterDashboardSkeleton, ClusterMetricsCard} from './components/ClusterMetricsCard';
import {ClusterMetricsCores} from './components/ClusterMetricsCores';
import {ClusterMetricsMemory} from './components/ClusterMetricsMemory';
import {ClusterMetricsStorage} from './components/ClusterMetricsStorage';
import {b} from './shared';
import {
    getDCInfo,
    getNodesRolesInfo,
    getStorageGroupStats,
    getTotalStorageGroupsUsed,
} from './utils';

import './ClusterDashboard.scss';

// fixed CPU calculation
export function isClusterInfoV5(info?: TClusterInfo): info is TClusterInfoV2 {
    return info
        ? 'Version' in info && typeof info.Version === 'number' && info.Version >= 5
        : false;
}

interface AmountProps {
    value?: number | string;
}

function Amount({value}: AmountProps) {
    if (!valueIsDefined(value)) {
        return null;
    }
    return (
        <Text variant="subheader-3" color="secondary">
            {formatNumber(value)}
        </Text>
    );
}

interface ClusterDashboardProps<T = TClusterInfo> {
    cluster: T;
    groupStats?: ClusterGroupsStats;
    loading?: boolean;
    error?: IResponseError | string;
}

export function ClusterDashboard({cluster, ...props}: ClusterDashboardProps) {
    const isSupportedClusterResponse = isClusterInfoV5(cluster);
    if (!isSupportedClusterResponse) {
        return null;
    }
    if (props.error) {
        return <ResponseError error={props.error} className={b('error')} />;
    }
    return (
        <div className={b()}>
            <Flex gap={4} wrap>
                <Flex gap={4} wrap="nowrap">
                    <ClusterDoughnuts {...props} cluster={cluster} />
                </Flex>
                <div className={b('cards-container')}>
                    <ClusterDashboardCards {...props} cluster={cluster} />
                </div>
            </Flex>
        </div>
    );
}

function ClusterDoughnuts({cluster, loading}: ClusterDashboardProps<TClusterInfoV2>) {
    if (loading) {
        return <ClusterDashboardSkeleton />;
    }
    const metricsCards = [];
    const {CoresUsed, NumberOfCpus, CoresTotal} = cluster;
    const total = CoresTotal ?? NumberOfCpus;
    if (valueIsDefined(CoresUsed) && valueIsDefined(total)) {
        metricsCards.push(<ClusterMetricsCores value={CoresUsed} capacity={total} key="cores" />);
    }
    const {StorageTotal, StorageUsed} = cluster;
    if (valueIsDefined(StorageTotal) && valueIsDefined(StorageUsed)) {
        metricsCards.push(
            <ClusterMetricsStorage key="storage" value={StorageUsed} capacity={StorageTotal} />,
        );
    }
    const {MemoryTotal, MemoryUsed} = cluster;
    if (valueIsDefined(MemoryTotal) && valueIsDefined(MemoryUsed)) {
        metricsCards.push(
            <ClusterMetricsMemory key="memory" value={MemoryUsed} capacity={MemoryTotal} />,
        );
    }
    return metricsCards;
}

function ClusterDashboardCards({cluster, groupStats = {}, loading}: ClusterDashboardProps) {
    if (loading) {
        return null;
    }
    const cards = [];

    const nodesRoles = getNodesRolesInfo(cluster);
    cards.push(
        <ClusterMetricsCard size="l" key={'roles'} title={i18n('label_nodes')}>
            <Flex gap={2} direction="column">
                <Amount value={cluster?.NodesAlive} />

                {nodesRoles?.length ? <Tags tags={nodesRoles} gap={3} /> : null}
            </Flex>
        </ClusterMetricsCard>,
    );

    if (Object.keys(groupStats).length) {
        const tags = getStorageGroupStats(groupStats);
        const total = getTotalStorageGroupsUsed(groupStats);
        cards.push(
            <ClusterMetricsCard size="l" key={'groups'} title={i18n('label_storage-groups')}>
                <Flex gap={2} direction="column">
                    <Amount value={total} />
                    <Tags tags={tags} gap={3} />
                </Flex>
            </ClusterMetricsCard>,
        );
    }

    const dataCenters = getDCInfo(cluster);
    if (dataCenters?.length) {
        cards.push(
            <ClusterMetricsCard size="l" key={'hosts'} title={i18n('label_hosts')}>
                <Flex gap={2} direction="column">
                    <Amount value={cluster?.Hosts} />
                    <Tags tags={dataCenters} gap={3} />
                </Flex>
            </ClusterMetricsCard>,
        );
    }

    if (cluster.Tenants) {
        cards.push(
            <ClusterMetricsCard size="l" key="tenants" title={i18n('label_databases')}>
                <Amount value={cluster?.Tenants} />
            </ClusterMetricsCard>,
        );
    }
    return cards;
}
