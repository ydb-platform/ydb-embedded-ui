import React from 'react';

import {Flex} from '@gravity-ui/uikit';
import {useLocation} from 'react-router-dom';

import {getTenantPath, parseQuery} from '../../../../../routes';
import {SETTING_KEYS} from '../../../../../store/reducers/settings/constants';
import {useSetting} from '../../../../../store/reducers/settings/useSetting';
import {TENANT_METRICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {TenantMetricsTab} from '../../../../../store/reducers/tenant/types';
import type {
    TenantMetricStats,
    TenantPoolsStats,
    TenantStorageStats,
} from '../../../../../store/reducers/tenants/utils';
import type {ETenantType} from '../../../../../types/api/tenant';
import {cn} from '../../../../../utils/cn';
import {calculateMetricAggregates} from '../../../../../utils/metrics';
// no direct legend formatters needed here – handled in subcomponents
import {TenantTabsGroups} from '../../../TenantPages';

import {CpuTab} from './components/CpuTab';
import {MemoryTab} from './components/MemoryTab';
import {NetworkTab} from './components/NetworkTab';
import {PlaceholderTab} from './components/PlaceholderTab';
import {StorageTab} from './components/StorageTab';

import './MetricsTabs.scss';

const b = cn('tenant-metrics-tabs');

interface MetricsTabsProps {
    poolsCpuStats?: TenantPoolsStats[];
    memoryStats?: TenantMetricStats[];
    blobStorageStats?: TenantStorageStats[];
    tabletStorageStats?: TenantStorageStats[];
    networkUtilization?: number;
    networkThroughput?: number;
    storageGroupsCount?: number;
    databaseType?: ETenantType;
    activeTab: TenantMetricsTab;
}

export function MetricsTabs({
    poolsCpuStats,
    memoryStats,
    blobStorageStats,
    tabletStorageStats,
    networkUtilization,
    networkThroughput,
    storageGroupsCount,
    databaseType,
    activeTab,
}: MetricsTabsProps) {
    const location = useLocation();
    const queryParams = parseQuery(location);

    const tabLinks: Record<TenantMetricsTab, string> = {
        [TENANT_METRICS_TABS_IDS.cpu]: getTenantPath({
            ...queryParams,
            [TenantTabsGroups.metricsTab]: TENANT_METRICS_TABS_IDS.cpu,
        }),
        [TENANT_METRICS_TABS_IDS.storage]: getTenantPath({
            ...queryParams,
            [TenantTabsGroups.metricsTab]: TENANT_METRICS_TABS_IDS.storage,
        }),
        [TENANT_METRICS_TABS_IDS.memory]: getTenantPath({
            ...queryParams,
            [TenantTabsGroups.metricsTab]: TENANT_METRICS_TABS_IDS.memory,
        }),
        [TENANT_METRICS_TABS_IDS.network]: getTenantPath({
            ...queryParams,
            [TenantTabsGroups.metricsTab]: TENANT_METRICS_TABS_IDS.network,
        }),
    };

    // Use only pools that directly indicate resources available to perform user queries
    const cpuPools = React.useMemo(
        () =>
            (poolsCpuStats || []).filter((pool) => !(pool.name === 'Batch' || pool.name === 'IO')),
        [poolsCpuStats],
    );
    const cpuMetrics = React.useMemo(() => calculateMetricAggregates(cpuPools), [cpuPools]);

    // Calculate storage metrics using utility
    const storageStats = React.useMemo(
        () => tabletStorageStats || blobStorageStats || [],
        [tabletStorageStats, blobStorageStats],
    );
    const storageMetrics = React.useMemo(
        () => calculateMetricAggregates(storageStats),
        [storageStats],
    );

    // Calculate memory metrics using utility
    const memoryMetrics = React.useMemo(
        () => calculateMetricAggregates(memoryStats),
        [memoryStats],
    );

    // Pass raw network values; DedicatedMetricsTabs computes percent and legend
    const {value: showNetworkUtilization} = useSetting<boolean>(
        SETTING_KEYS.SHOW_NETWORK_UTILIZATION,
    );

    // card variant is handled within subcomponents

    const isServerless = databaseType === 'Serverless';

    const renderNetworkTab = () => {
        if (!showNetworkUtilization) {
            return null;
        }

        const canShow =
            networkUtilization !== undefined &&
            networkThroughput !== undefined &&
            isFinite(networkUtilization) &&
            isFinite(networkThroughput);

        if (!canShow) {
            return null;
        }

        if (isServerless) {
            return <PlaceholderTab />;
        }

        return (
            <NetworkTab
                to={tabLinks[TENANT_METRICS_TABS_IDS.network]}
                active={activeTab === TENANT_METRICS_TABS_IDS.network}
                networkUtilization={networkUtilization}
                networkThroughput={networkThroughput}
            />
        );
    };

    return (
        <Flex className={b({serverless: Boolean(isServerless)})} alignItems="center">
            <CpuTab
                to={tabLinks[TENANT_METRICS_TABS_IDS.cpu]}
                active={activeTab === TENANT_METRICS_TABS_IDS.cpu}
                isServerless={Boolean(isServerless)}
                cpu={{totalUsed: cpuMetrics.totalUsed, totalLimit: cpuMetrics.totalLimit}}
            />
            <StorageTab
                to={tabLinks[TENANT_METRICS_TABS_IDS.storage]}
                active={activeTab === TENANT_METRICS_TABS_IDS.storage}
                isServerless={Boolean(isServerless)}
                storage={{
                    totalUsed: storageMetrics.totalUsed,
                    totalLimit: storageMetrics.totalLimit,
                }}
                storageGroupsCount={storageGroupsCount}
            />
            {isServerless ? (
                <PlaceholderTab />
            ) : (
                <MemoryTab
                    to={tabLinks[TENANT_METRICS_TABS_IDS.memory]}
                    active={activeTab === TENANT_METRICS_TABS_IDS.memory}
                    memory={{
                        totalUsed: memoryMetrics.totalUsed,
                        totalLimit: memoryMetrics.totalLimit,
                    }}
                />
            )}
            {renderNetworkTab()}
        </Flex>
    );
}
