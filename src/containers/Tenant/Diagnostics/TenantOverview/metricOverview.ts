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
    tabletStorageStats?: TenantStorageStats[];
}

interface GetTenantOverviewMetricsParams {
    blobStorageStats?: TenantStorageStats[];
    coresTotal?: number;
    isServerless: boolean;
    memoryStats?: TenantMetricStats[];
    networkThroughput?: number;
    networkUtilization?: number;
    poolsStats?: TenantPoolsStats[];
    storageMetricStats?: TenantStorageStats[];
    tabletStorageStats?: TenantStorageStats[];
}

export interface MetricTabsData {
    // CPU, memory and storage are omitted only for Serverless. Dedicated databases
    // keep these metrics even when data is missing and display them as N/A.
    cpu?: MetricTabPresentation;
    memory?: MetricTabPresentation;
    network?: MetricTabPresentation;
    storage?: MetricTabPresentation;
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
}: SelectStorageStatsForMetricCardParams) {
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

type NetworkMetricParams = Pick<
    GetTenantOverviewMetricsParams,
    'networkThroughput' | 'networkUtilization'
>;

interface AvailableNetworkMetricParams {
    networkThroughput: number;
    networkUtilization: number;
}

function hasNetworkMetricData(params: NetworkMetricParams): params is AvailableNetworkMetricParams {
    return (
        params.networkUtilization !== undefined &&
        params.networkThroughput !== undefined &&
        Number.isFinite(params.networkUtilization) &&
        Number.isFinite(params.networkThroughput)
    );
}

function getNetworkMetricData(params: NetworkMetricParams): MetricTabPresentation | undefined {
    if (!hasNetworkMetricData(params)) {
        return undefined;
    }

    return getMetricTabPresentation({usagePercent: params.networkUtilization * 100});
}

function getNetworkMetricSummary(params: NetworkMetricParams): MetricPageSummaryData | undefined {
    if (!hasNetworkMetricData(params)) {
        return undefined;
    }

    return {
        description: i18n('context_network-description'),
        presentation: getMetricPageSummaryPresentation({
            usagePercent: params.networkUtilization * 100,
            valueText: formatNetworkMetric(params.networkThroughput) || undefined,
        }),
    };
}

export function getTenantOverviewMetrics({
    blobStorageStats,
    coresTotal,
    isServerless,
    memoryStats,
    networkThroughput,
    networkUtilization,
    poolsStats,
    storageMetricStats,
    tabletStorageStats,
}: GetTenantOverviewMetricsParams): TenantOverviewMetrics {
    if (isServerless) {
        return {summaries: {}, tabs: {}};
    }

    const cpuPools = (poolsStats || []).filter((pool) => pool.name !== 'IO');
    const cpuMetrics = calculateMetricAggregates(cpuPools);
    const cpuLimit = coresTotal && coresTotal > 0 ? coresTotal : cpuMetrics.totalLimit;
    const storageStats =
        storageMetricStats ??
        selectStorageStatsForMetricCard({blobStorageStats, tabletStorageStats});
    const storageMetrics = calculateMetricAggregates(storageStats);
    const cpuUsagePercent = calculateUsagePercent(cpuMetrics.totalUsed, cpuLimit);
    const memoryMetrics = calculateMetricAggregates(memoryStats);
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
        network: getNetworkMetricData({networkThroughput, networkUtilization}),
        // Never show the "danger" (red) status for storage, regardless of usage.
        // Keep the status "warning" (yellow) above the warning threshold and
        // never switch to red, including when usage grows into high values
        // (for example, 91-99%) or goes above 100%.
        storage: getMetricTabPresentation({
            usagePercent: storageUsagePercent,
            dangerThreshold: Infinity,
        }),
    };

    const networkSummary = getNetworkMetricSummary({networkThroughput, networkUtilization});
    const cpuValueText =
        cpuLimit > 0
            ? formatCoresLegend({
                  value: cpuMetrics.totalUsed,
                  capacity: cpuLimit,
              })
            : undefined;
    const memoryValueText =
        memoryMetrics.totalLimit > 0
            ? formatStorageLegend({
                  value: memoryMetrics.totalUsed,
                  capacity: memoryMetrics.totalLimit,
              })
            : undefined;

    return {
        summaries: {
            cpu: {
                description: i18n('context_cpu-description'),
                presentation: getMetricPageSummaryPresentation({
                    usagePercent: cpuUsagePercent,
                    valueText: cpuValueText,
                }),
            },
            memory: {
                description: i18n('context_memory-description'),
                presentation: getMetricPageSummaryPresentation({
                    usagePercent: memoryUsagePercent,
                    valueText: memoryValueText,
                }),
            },
            network: networkSummary,
        },
        tabs,
    };
}
