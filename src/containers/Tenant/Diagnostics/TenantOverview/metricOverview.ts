import type {
    TenantMetricStats,
    TenantPoolsStats,
    TenantStorageStats,
} from '../../../../store/reducers/tenants/utils';
import {EFlag} from '../../../../types/api/enums';
import {calculateMetricAggregates} from '../../../../utils/metrics';
import {formatCoresLegend, formatStorageLegend} from '../../../../utils/metrics/formatMetricLegend';
import type {MetricFormatParams} from '../../../../utils/metrics/formatMetricLegend';
import {
    calculateBaseDiagramValues,
    getDiagramValues,
} from '../../../../utils/metrics/getDiagramValues';
import type {
    DiagramValuesFallback,
    DiagramValuesStatus,
} from '../../../../utils/metrics/getDiagramValues';

interface SelectStorageStatsForMetricCardParams {
    blobStorageStats?: TenantStorageStats[];
    tabletStorageStats?: TenantStorageStats[];
}

interface GetTenantOverviewMetricsParams {
    blobStorageStats?: TenantStorageStats[];
    coresTotal?: number;
    isServerless: boolean;
    memoryStats?: TenantMetricStats[];
    networkUtilization?: number;
    poolsStats?: TenantPoolsStats[];
    storageMetricStats?: TenantStorageStats[];
    tabletStorageStats?: TenantStorageStats[];
}

export type MetricProgressTheme = 'neutral' | 'success' | 'warning' | 'danger';

export interface TenantOverviewMetric {
    percentText?: string;
    progressTheme: MetricProgressTheme;
    progressValue: number;
    status: EFlag;
}

export interface TenantOverviewUsageMetric extends TenantOverviewMetric {
    capacity: number;
    legend?: string;
    value: number;
}

export interface TenantOverviewMetrics {
    cpu?: TenantOverviewUsageMetric;
    memory?: TenantOverviewUsageMetric;
    network?: TenantOverviewMetric;
    storage?: TenantOverviewUsageMetric;
}

const DiagramStatusToEFlag: Record<DiagramValuesStatus, EFlag> = {
    good: EFlag.Green,
    warning: EFlag.Yellow,
    danger: EFlag.Red,
    unavailable: EFlag.Grey,
};

const DiagramStatusToTheme: Record<DiagramValuesStatus, MetricProgressTheme> = {
    good: 'success',
    warning: 'warning',
    danger: 'danger',
    unavailable: 'neutral',
};

const UNAVAILABLE_METRIC_FALLBACK: DiagramValuesFallback = {
    percents: undefined,
    status: 'unavailable',
};

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

function createSafeLegendFormatter(formatter: (params: MetricFormatParams) => string) {
    return ({value, capacity}: MetricFormatParams) => {
        if (!Number.isFinite(value) || !Number.isFinite(capacity) || capacity <= 0) {
            return undefined;
        }

        return formatter({value, capacity});
    };
}

const formatCpuLegend = createSafeLegendFormatter(formatCoresLegend);
const formatMemoryLegend = createSafeLegendFormatter(formatStorageLegend);

function getMetricPresentation({
    dangerThreshold,
    legendFormatter,
    value,
    capacity,
}: {
    dangerThreshold?: number;
    legendFormatter?: (params: MetricFormatParams) => string | undefined;
    value: number;
    capacity: number;
}): TenantOverviewUsageMetric {
    const diagramValues = getDiagramValues({
        value,
        capacity,
        dangerThreshold,
        fallback: UNAVAILABLE_METRIC_FALLBACK,
        legendFormatter,
    });
    const {legend} = diagramValues;

    return {
        percentText: diagramValues.percents,
        progressValue: diagramValues.progressValue,
        progressTheme: DiagramStatusToTheme[diagramValues.status],
        status: DiagramStatusToEFlag[diagramValues.status],
        legend,
        value,
        capacity,
    };
}

function getNetworkMetric(networkUtilization?: number): TenantOverviewMetric | undefined {
    if (networkUtilization === undefined || !Number.isFinite(networkUtilization)) {
        return undefined;
    }

    // Network comes as raw utilization; convert it to percent for tab and summary views.
    const diagramValues = calculateBaseDiagramValues({
        fillWidth: networkUtilization * 100,
    });

    return {
        percentText: diagramValues.percents,
        progressValue: diagramValues.progressValue,
        progressTheme: DiagramStatusToTheme[diagramValues.status],
        status: DiagramStatusToEFlag[diagramValues.status],
    };
}

export function getTenantOverviewMetrics({
    blobStorageStats,
    coresTotal,
    isServerless,
    memoryStats,
    networkUtilization,
    poolsStats,
    storageMetricStats,
    tabletStorageStats,
}: GetTenantOverviewMetricsParams): TenantOverviewMetrics {
    if (isServerless) {
        return {};
    }

    // Sum CPU usage from all pools except the IO pool.
    const cpuPools = (poolsStats || []).filter((pool) => pool.name !== 'IO');
    const cpuMetrics = calculateMetricAggregates(cpuPools);
    const cpuLimit = coresTotal && coresTotal > 0 ? coresTotal : cpuMetrics.totalLimit;

    // Calculate storage metrics using explicit metric stats when available.
    const storageStats =
        storageMetricStats ??
        selectStorageStatsForMetricCard({blobStorageStats, tabletStorageStats});
    const storageMetrics = calculateMetricAggregates(storageStats);

    // Calculate memory metrics using utility.
    const memoryMetrics = calculateMetricAggregates(memoryStats);

    return {
        cpu: getMetricPresentation({
            value: cpuMetrics.totalUsed,
            capacity: cpuLimit,
            legendFormatter: formatCpuLegend,
        }),
        memory: getMetricPresentation({
            value: memoryMetrics.totalUsed,
            capacity: memoryMetrics.totalLimit,
            legendFormatter: formatMemoryLegend,
        }),
        network: getNetworkMetric(networkUtilization),
        // Never show the "danger" (red) status for storage, regardless of usage.
        // Keep the status "warning" (yellow) above the warning threshold and
        // never switch to red, including when usage grows into high values
        // (for example, 91-99%) or goes above 100%.
        storage: getMetricPresentation({
            value: storageMetrics.totalUsed,
            capacity: storageMetrics.totalLimit,
            dangerThreshold: Infinity,
        }),
    };
}
