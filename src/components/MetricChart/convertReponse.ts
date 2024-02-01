import type {MetricData} from '../../types/api/render';
import type {MetricDescription, PreparedMetric, PreparedMetricsData} from './types';

export const convertResponse = (
    data: MetricData[] = [],
    metrics: MetricDescription[],
): PreparedMetricsData => {
    const preparedMetrics = data
        .map(({datapoints, target}) => {
            const metricDescription = metrics.find((metric) => metric.target === target);

            if (!metricDescription) {
                return undefined;
            }

            const chartData = datapoints.map((datapoint) => datapoint[0]);

            return {
                ...metricDescription,
                data: chartData,
            };
        })
        .filter((metric): metric is PreparedMetric => metric !== undefined);

    // Asuming all metrics in response have the same timeline
    // Backend return data in seconds, while chart needs ms
    const timeline = data[0].datapoints.map((datapoint) => datapoint[1] * 1000);

    return {
        timeline,
        metrics: preparedMetrics,
    };
};
