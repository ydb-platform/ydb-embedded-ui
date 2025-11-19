import React from 'react';

import {Disclosure, Flex, Icon, Text} from '@gravity-ui/uikit';

import {ResponseError} from '../../../components/Errors/ResponseError';
import {
    useBridgeModeEnabled,
    useClusterDashboardAvailable,
} from '../../../store/reducers/capabilities/hooks';
import type {ClusterGroupsStats} from '../../../store/reducers/cluster/types';
import {SETTING_KEYS} from '../../../store/reducers/settings/constants';
import {useSetting} from '../../../store/reducers/settings/useSetting';
import type {AdditionalClusterProps} from '../../../types/additionalProps';
import {isClusterInfoV2, isClusterInfoV5} from '../../../types/api/cluster';
import type {TClusterInfo} from '../../../types/api/cluster';
import type {IResponseError} from '../../../types/api/error';
import {valueIsDefined} from '../../../utils';
import {useResizeObserverTrigger} from '../../../utils/hooks/useResizeObserverTrigger';
import {ClusterInfo} from '../ClusterInfo/ClusterInfo';
import i18n from '../i18n';
import {getTotalStorageGroupsUsed} from '../utils';

import {ClusterDashboardSkeleton} from './components/ClusterMetricsCard';
import {ClusterMetricsCores} from './components/ClusterMetricsCores';
import {ClusterMetricsMemory} from './components/ClusterMetricsMemory';
import {ClusterMetricsNetwork} from './components/ClusterMetricsNetwork';
import {ClusterMetricsStorage} from './components/ClusterMetricsStorage';
import {b} from './shared';

import overviewIcon from '../../../assets/icons/overview.svg';

import './ClusterOverview.scss';

interface ClusterOverviewProps {
    cluster: TClusterInfo;
    groupStats?: ClusterGroupsStats;
    loading?: boolean;
    error?: IResponseError | string;
    additionalClusterProps?: AdditionalClusterProps;
    collapsed?: boolean;
}

export function ClusterOverview(props: ClusterOverviewProps) {
    const {value: expandDashboard, saveValue: setExpandDashboard} = useSetting<boolean>(
        SETTING_KEYS.EXPAND_CLUSTER_DASHBOARD,
    );

    //needs timeout to ensure layout has been recalculated after Disclosure animations
    useResizeObserverTrigger([expandDashboard], 110);
    const bridgeModeEnabled = useBridgeModeEnabled();

    const bridgePiles = React.useMemo(() => {
        if (!bridgeModeEnabled || !isClusterInfoV5(props.cluster)) {
            return undefined;
        }

        const {BridgeInfo} = props.cluster;
        return BridgeInfo?.Piles?.length ? BridgeInfo.Piles : undefined;
    }, [props.cluster, bridgeModeEnabled]);
    if (props.error) {
        return <ResponseError error={props.error} className={b('error')} />;
    }

    return (
        <Disclosure
            arrowPosition="end"
            size="l"
            expanded={expandDashboard}
            onUpdate={() => setExpandDashboard(!expandDashboard)}
            className={b('overview-wrapper', {collapsed: !expandDashboard})}
            summary={
                <Flex
                    alignItems="center"
                    justifyContent="space-between"
                    width={'100%'}
                    className={b('disclosure-summary')}
                >
                    <Flex gap={2} alignItems="center">
                        <Icon data={overviewIcon} size={16} />
                        <Text variant="body-2" color="primary" className={b('title')}>
                            {i18n('label_overview')}
                        </Text>
                    </Flex>
                    {!expandDashboard && <ClusterDashboard {...props} collapsed />}
                </Flex>
            }
        >
            <div className={b('disclosure-content')}>
                <ClusterDashboard {...props} />
                <ClusterInfo {...props} bridgePiles={bridgePiles} />
            </div>
        </Disclosure>
    );
}

interface ClusterDashboardProps extends ClusterOverviewProps {
    collapsed?: boolean;
}

function ClusterDashboard({collapsed, ...props}: ClusterDashboardProps) {
    const isClusterDashboardAvailable = useClusterDashboardAvailable();
    if (!isClusterDashboardAvailable) {
        return null;
    }
    return (
        <Flex wrap className={b('dashboard-wrapper', {collapsed})}>
            <ClusterDoughnuts {...props} collapsed={collapsed} />
        </Flex>
    );
}

function ClusterDoughnuts({cluster, groupStats = {}, loading, collapsed}: ClusterOverviewProps) {
    if (loading) {
        return <ClusterDashboardSkeleton collapsed={collapsed} />;
    }
    const metricsCards: React.ReactNode[] = [];
    if (isClusterInfoV2(cluster)) {
        const {CoresUsed, NumberOfCpus, CoresTotal} = cluster;
        const total = CoresTotal ?? NumberOfCpus;
        if (valueIsDefined(CoresUsed) && valueIsDefined(total)) {
            metricsCards.push(
                <ClusterMetricsCores
                    value={CoresUsed}
                    capacity={total}
                    key="cores"
                    collapsed={collapsed}
                />,
            );
        }
    }
    const {StorageTotal, StorageUsed} = cluster;
    if (valueIsDefined(StorageTotal) && valueIsDefined(StorageUsed)) {
        const total = getTotalStorageGroupsUsed(groupStats);
        metricsCards.push(
            <ClusterMetricsStorage
                key="storage"
                value={StorageUsed}
                capacity={StorageTotal}
                groups={total}
                collapsed={collapsed}
            />,
        );
    }
    const {MemoryTotal, MemoryUsed} = cluster;
    if (valueIsDefined(MemoryTotal) && valueIsDefined(MemoryUsed)) {
        metricsCards.push(
            <ClusterMetricsMemory
                key="memory"
                value={MemoryUsed}
                capacity={MemoryTotal}
                collapsed={collapsed}
            />,
        );
    }
    if (isClusterInfoV5(cluster)) {
        const {NetworkUtilization, NetworkWriteThroughput} = cluster;
        if (valueIsDefined(NetworkUtilization)) {
            metricsCards.push(
                <ClusterMetricsNetwork
                    key="network"
                    percentsValue={NetworkUtilization}
                    throughput={NetworkWriteThroughput}
                    collapsed={collapsed}
                />,
            );
        }
    }

    return metricsCards;
}
