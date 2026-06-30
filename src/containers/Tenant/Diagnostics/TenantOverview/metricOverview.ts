import type {
    TenantMetricStats,
    TenantPoolsStats,
    TenantStorageStats,
} from '../../../../store/reducers/tenants/utils';
import {calculateMetricAggregates} from '../../../../utils/metrics';
import {
    formatCoresLegend,
    formatNetworkMetric,
    formatStorageLegend,
} from '../../../../utils/metrics/formatMetricLegend';

import type {MetricPageSummaryData} from './MetricPageSummary/MetricPageSummary';
import i18n from './i18n';
import {
    calculateUsagePercent,
    getMetricPageSummaryPresentation,
    getMetricTabPresentation,
} from './metricPresentation';
import type {MetricTabPresentation} from './metricPresentation';

interface SelectStorageStatsForMetricCardParams {
    blobStorageStats?: TenantStorageStats[];
    isServerless: boolean;
    tabletStorageStats?: TenantStorageStats[];
}

interface GetTenantOverviewMetricsParams {
    blobStorageStats?: TenantStorageStats[];
    coresTotal?: number;
    hasTenant: boolean;
    isServerless: boolean;
    memoryStats?: TenantMetricStats[];
    networkThroughput?: number;
    networkUtilization?: number;
    poolsStats?: TenantPoolsStats[];
    storageMetricStats?: TenantStorageStats[];
    tabletStorageStats?: TenantStorageStats[];
}

export interface MetricTabsData {
    cpu: MetricTabPresentation;
    memory: MetricTabPresentation;
    network?: MetricTabPresentation;
    storage: MetricTabPresentation;
}

export interface MetricPageSummaries {
    cpu?: MetricPageSummaryData;
    memory?: MetricPageSummaryData;
    network?: MetricPageSummaryData;
}

export interface TenantOverviewMetrics {
    summaries: MetricPageSummaries;
    tabs: MetricTabsData;
}

export function selectStorageStatsForMetricCard({
    blobStorageStats,
    tabletStorageStats,
    isServerless,
}: SelectStorageStatsForMetricCardParams) {
    if (isServerless) {
        return tabletStorageStats || blobStorageStats || [];
    }

    const hasLimit = (stats?: TenantStorageStats[]) =>
        Boolean(stats?.some((item) => Number(item.limit) > 0));

    if (hasLimit(tabletStorageStats)) {
        return tabletStorageStats || [];
    }

    if (hasLimit(blobStorageStats)) {
        return blobStorageStats || [];
    }

    return blobStorageStats || tabletStorageStats || [];
}

function getNetworkMetricData({
    isServerless,
    networkUtilization,
}: Pick<GetTenantOverviewMetricsParams, 'isServerless' | 'networkUtilization'>):
    | MetricTabPresentation
    | undefined {
    if (isServerless || networkUtilization === undefined || !Number.isFinite(networkUtilization)) {
        return undefined;
    }

    return getMetricTabPresentation({usagePercent: networkUtilization * 100});
}

function getNetworkMetricSummary({
    networkThroughput,
    networkUtilization,
}: Pick<GetTenantOverviewMetricsParams, 'networkThroughput' | 'networkUtilization'>):
    | MetricPageSummaryData
    | undefined {
    if (
        networkThroughput === undefined ||
        !Number.isFinite(networkThroughput) ||
        networkUtilization === undefined ||
        !Number.isFinite(networkUtilization)
    ) {
        return undefined;
    }

    return {
        description: i18n('context_network-description'),
        presentation: getMetricPageSummaryPresentation({
            usagePercent: networkUtilization * 100,
            valueText: formatNetworkMetric(networkThroughput) || undefined,
        }),
    };
}

export function getTenantOverviewMetrics({
    blobStorageStats,
    coresTotal,
    hasTenant,
    isServerless,
    memoryStats,
    networkThroughput,
    networkUtilization,
    poolsStats,
    storageMetricStats,
    tabletStorageStats,
}: GetTenantOverviewMetricsParams): TenantOverviewMetrics {
    const cpuPools = (poolsStats || []).filter((pool) => pool.name !== 'IO');
    const cpuMetrics = calculateMetricAggregates(cpuPools);
    const cpuLimit = coresTotal && coresTotal > 0 ? coresTotal : cpuMetrics.totalLimit;
    const memoryMetrics = calculateMetricAggregates(memoryStats);
    const storageStats =
        storageMetricStats ??
        selectStorageStatsForMetricCard({blobStorageStats, tabletStorageStats, isServerless});
    const storageMetrics = calculateMetricAggregates(storageStats);
    const network = getNetworkMetricData({isServerless, networkUtilization});
    const cpuUsagePercent = calculateUsagePercent(cpuMetrics.totalUsed, cpuLimit);
    const memoryUsagePercent = calculateUsagePercent(
        memoryMetrics.totalUsed,
        memoryMetrics.totalLimit,
    );
    const storageUsagePercent = calculateUsagePercent(
        storageMetrics.totalUsed,
        storageMetrics.totalLimit,
    );

    const tabs: MetricTabsData = {
        cpu: getMetricTabPresentation({usagePercent: cpuUsagePercent}),
        memory: getMetricTabPresentation({usagePercent: memoryUsagePercent}),
        network,
        // Never show the "danger" (red) status for storage, regardless of usage.
        // Keep the status "warning" (yellow) above the warning threshold and
        // never switch to red, including when usage grows into high values
        // (for example, 91-99%) or goes above 100%.
        storage: getMetricTabPresentation({
            usagePercent: storageUsagePercent,
            dangerThreshold: Infinity,
        }),
    };

    if (!hasTenant || isServerless) {
        return {summaries: {}, tabs};
    }

    const networkSummary = getNetworkMetricSummary({networkThroughput, networkUtilization});

    return {
        summaries: {
            cpu: {
                description: i18n('context_cpu-description'),
                presentation: getMetricPageSummaryPresentation({
                    usagePercent: cpuUsagePercent,
                    valueText: formatCoresLegend({
                        value: cpuMetrics.totalUsed,
                        capacity: cpuLimit,
                    }),
                }),
            },
            memory: {
                description: i18n('context_memory-description'),
                presentation: getMetricPageSummaryPresentation({
                    usagePercent: memoryUsagePercent,
                    valueText: formatStorageLegend({
                        value: memoryMetrics.totalUsed,
                        capacity: memoryMetrics.totalLimit,
                    }),
                }),
            },
            network: networkSummary,
        },
        tabs,
    };
}
