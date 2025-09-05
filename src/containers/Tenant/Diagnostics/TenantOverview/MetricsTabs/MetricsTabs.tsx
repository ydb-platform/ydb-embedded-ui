import {useMemo} from 'react';

import {Flex} from '@gravity-ui/uikit';
import {useLocation} from 'react-router-dom';

import {parseQuery} from '../../../../../routes';
import {TENANT_METRICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {TenantMetricsTab} from '../../../../../store/reducers/tenant/types';
import type {
    TenantMetricStats,
    TenantPoolsStats,
    TenantStorageStats,
} from '../../../../../store/reducers/tenants/utils';
import type {ETenantType} from '../../../../../types/api/tenant';
import {cn} from '../../../../../utils/cn';
import {SHOW_NETWORK_UTILIZATION} from '../../../../../utils/constants';
import {useSetting} from '../../../../../utils/hooks';
import {calculateMetricAggregates} from '../../../../../utils/metrics';
// no direct legend formatters needed here – handled in subcomponents
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';

import {CommonMetricsTabs} from './CommonMetricsTabs';
import {DedicatedMetricsTabs} from './DedicatedMetricsTabs';
import {ServerlessPlaceholderTabs} from './ServerlessPlaceholderTabs';

import './MetricsTabs.scss';

const b = cn('tenant-metrics-tabs');

interface MetricsTabsProps {
    poolsCpuStats?: TenantPoolsStats[];
    memoryStats?: TenantMetricStats[];
    blobStorageStats?: TenantStorageStats[];
    tabletStorageStats?: TenantStorageStats[];
    networkStats?: TenantMetricStats[];
    storageGroupsCount?: number;
    databaseType?: ETenantType;
    activeTab: TenantMetricsTab;
}

export function MetricsTabs({
    poolsCpuStats,
    memoryStats,
    blobStorageStats,
    tabletStorageStats,
    networkStats,
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
    const cpuPools = useMemo(
        () =>
            (poolsCpuStats || []).filter((pool) => !(pool.name === 'Batch' || pool.name === 'IO')),
        [poolsCpuStats],
    );
    const cpuMetrics = useMemo(() => calculateMetricAggregates(cpuPools), [cpuPools]);

    // Calculate storage metrics using utility
    const storageStats = useMemo(
        () => tabletStorageStats || blobStorageStats || [],
        [tabletStorageStats, blobStorageStats],
    );
    const storageMetrics = useMemo(() => calculateMetricAggregates(storageStats), [storageStats]);

    // Calculate memory metrics using utility
    const memoryMetrics = useMemo(() => calculateMetricAggregates(memoryStats), [memoryStats]);

    // Calculate network metrics using utility
    const [showNetworkUtilization] = useSetting<boolean>(SHOW_NETWORK_UTILIZATION);
    const networkMetrics = useMemo(
        () => (networkStats ? calculateMetricAggregates(networkStats) : null),
        [networkStats],
    );

    // card variant is handled within subcomponents

    const isServerless = databaseType === 'Serverless';

    return (
        <Flex className={b({serverless: Boolean(isServerless)})} alignItems="center">
            <CommonMetricsTabs
                activeTab={activeTab}
                tabLinks={tabLinks}
                cpu={{totalUsed: cpuMetrics.totalUsed, totalLimit: cpuMetrics.totalLimit}}
                storage={{
                    totalUsed: storageMetrics.totalUsed,
                    totalLimit: storageMetrics.totalLimit,
                }}
                storageGroupsCount={storageGroupsCount}
                databaseType={databaseType}
            />
            {isServerless ? (
                <ServerlessPlaceholderTabs />
            ) : (
                <DedicatedMetricsTabs
                    activeTab={activeTab}
                    tabLinks={tabLinks}
                    memory={{
                        totalUsed: memoryMetrics.totalUsed,
                        totalLimit: memoryMetrics.totalLimit,
                    }}
                    network={networkMetrics}
                    showNetwork={Boolean(showNetworkUtilization && networkStats && networkMetrics)}
                />
            )}
        </Flex>
    );
}
