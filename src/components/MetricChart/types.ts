export type Metric =
    | 'queries.requests'
    | 'queries.latencies.p50'
    | 'queries.latencies.p75'
    | 'queries.latencies.p90'
    | 'queries.latencies.p99'
    | 'resources.cpu.usage'
    | 'resources.memory.used_bytes'
    | 'resources.storage.used_bytes';

export interface MetricDescription {
    target: Metric;
    title?: string;
    color?: string;
}

export interface PreparedMetric extends MetricDescription {
    data: number[];
}

export interface PreparedMetricsData {
    timeline: number[];
    metrics: PreparedMetric[];
}

export type ChartValue = number | string | null;

export type ChartDataType = 'ms' | 'size';

export interface ChartOptions {
    dataType?: ChartDataType;
}
