import {useMemo} from 'react';

import {Flex} from '@gravity-ui/uikit';
import {Link, useLocation} from 'react-router-dom';

import {parseQuery} from '../../../../../routes';
import {TENANT_METRICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {TenantMetricsTab} from '../../../../../store/reducers/tenant/types';
import type {
    TenantMetricStats,
    TenantPoolsStats,
    TenantStorageStats,
} from '../../../../../store/reducers/tenants/utils';
import {cn} from '../../../../../utils/cn';
import {SHOW_NETWORK_UTILIZATION} from '../../../../../utils/constants';
import {useSetting} from '../../../../../utils/hooks';
import {calculateMetricAggregates} from '../../../../../utils/metrics';
import {
    formatCoresLegend,
    formatSpeedLegend,
    formatStorageLegend,
} from '../../../../../utils/metrics/formatMetricLegend';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {TabCard} from '../TabCard/TabCard';
import i18n from '../i18n';

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
    isServerless?: boolean;
    activeTab: TenantMetricsTab;
}

export function MetricsTabs({
    poolsCpuStats,
    memoryStats,
    blobStorageStats,
    tabletStorageStats,
    networkStats,
    storageGroupsCount,
    isServerless,
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

    const cardVariant = isServerless ? 'serverless' : 'default';

    return (
        <Flex className={b({serverless: Boolean(isServerless)})} alignItems="center">
            <div
                className={b('link-container', {
                    active: activeTab === TENANT_METRICS_TABS_IDS.cpu,
                })}
            >
                <Link to={tabLinks.cpu} className={b('link')}>
                    <TabCard
                        text={i18n('context_cpu-load')}
                        value={cpuMetrics.totalUsed}
                        limit={cpuMetrics.totalLimit}
                        legendFormatter={formatCoresLegend}
                        active={activeTab === TENANT_METRICS_TABS_IDS.cpu}
                        helpText={i18n('context_cpu-description')}
                        variant={cardVariant}
                        subtitle={isServerless ? i18n('serverless.autoscaled') : undefined}
                    />
                </Link>
            </div>
            <div
                className={b('link-container', {
                    active: activeTab === TENANT_METRICS_TABS_IDS.storage,
                })}
            >
                <Link to={tabLinks.storage} className={b('link')}>
                    <TabCard
                        text={i18n('cards.storage-label')}
                        value={storageMetrics.totalUsed}
                        limit={storageMetrics.totalLimit}
                        legendFormatter={formatStorageLegend}
                        active={activeTab === TENANT_METRICS_TABS_IDS.storage}
                        helpText={i18n('context_storage-description')}
                        variant={cardVariant}
                        subtitle={
                            isServerless && storageMetrics.totalLimit
                                ? i18n('serverless.storage-subtitle', {
                                      groups: String(storageGroupsCount ?? 0),
                                      legend: formatStorageLegend({
                                          value: storageMetrics.totalUsed,
                                          capacity: storageMetrics.totalLimit,
                                      }),
                                  })
                                : undefined
                        }
                    />
                </Link>
            </div>
            {!isServerless && (
                <>
                    <div
                        className={b('link-container', {
                            active: activeTab === TENANT_METRICS_TABS_IDS.memory,
                        })}
                    >
                        <Link to={tabLinks.memory} className={b('link')}>
                            <TabCard
                                text={i18n('context_memory-used')}
                                value={memoryMetrics.totalUsed}
                                limit={memoryMetrics.totalLimit}
                                legendFormatter={formatStorageLegend}
                                active={activeTab === TENANT_METRICS_TABS_IDS.memory}
                                helpText={i18n('context_memory-description')}
                            />
                        </Link>
                    </div>
                    {showNetworkUtilization && networkStats && networkMetrics && (
                        <div
                            className={b('link-container', {
                                active: activeTab === TENANT_METRICS_TABS_IDS.network,
                            })}
                        >
                            <Link to={tabLinks.network} className={b('link')}>
                                <TabCard
                                    text={i18n('context_network-usage')}
                                    value={networkMetrics.totalUsed}
                                    limit={networkMetrics.totalLimit}
                                    legendFormatter={formatSpeedLegend}
                                    active={activeTab === TENANT_METRICS_TABS_IDS.network}
                                    helpText={i18n('context_network-description')}
                                />
                            </Link>
                        </div>
                    )}
                </>
            )}

            {isServerless && <ServerlessPlaceholderTabs />}
        </Flex>
    );
}
