import type {PoolName} from '../../types/api/nodes';

type Percentile = 'p50' | 'p75' | 'p90' | 'p99';
type QueriesLatenciesMetric = `queries.latencies.${Percentile}`;

type PoolUsageMetric = `resources.cpu.${PoolName}.usage`;

export type Metric =
    | 'queries.requests'
    | 'resources.memory.used_bytes'
    | 'resources.storage.used_bytes'
    | 'resources.cpu.usage'
    | PoolUsageMetric
    | QueriesLatenciesMetric;

export interface MetricDescription {
    target: Metric;
    title?: string;
    color?: string;
}

export interface PreparedMetric extends MetricDescription {
    data: (number | null)[];
}

export interface PreparedMetricsData {
    timeline: number[];
    metrics: PreparedMetric[];
}

export type ChartValue = number | string | null;

export type ChartDataType = 'ms' | 'size' | 'percent';

export interface ChartOptions {
    dataType?: ChartDataType;
}

export type ChartDataStatus = 'loading' | 'success' | 'error';
export type OnChartDataStatusChange = (newStatus: ChartDataStatus) => void;
