import type {ChartConfig} from '../TenantDashboard/TenantDashboard';
import i18n from '../i18n';

export const defaultDashboardConfig: ChartConfig[] = [
    {
        title: i18n('charts.queries-per-second'),
        metrics: [
            {
                target: 'queries.requests',
                title: i18n('charts.queries-per-second'),
            },
        ],
    },
    {
        title: i18n('charts.queries-latency', {percentile: ''}),
        metrics: [
            {
                target: 'queries.latencies.p50',
                title: 'p50',
            },
            {
                target: 'queries.latencies.p75',
                title: 'p75',
            },
            {
                target: 'queries.latencies.p90',
                title: 'p90',
            },
            {
                target: 'queries.latencies.p99',
                title: 'p99',
            },
        ],
        options: {
            dataType: 'ms',
            showLegend: true,
        },
    },
];
