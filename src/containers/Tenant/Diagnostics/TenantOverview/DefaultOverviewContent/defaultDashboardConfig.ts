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
        title: i18n('charts.transaction-latency', {percentile: ''}),
        metrics: [
            {
                target: 'queries.latencies.p50',
                title: i18n('charts.transaction-latency', {
                    percentile: 'p50',
                }),
            },
            {
                target: 'queries.latencies.p75',
                title: i18n('charts.transaction-latency', {
                    percentile: 'p75',
                }),
            },
            {
                target: 'queries.latencies.p90',
                title: i18n('charts.transaction-latency', {
                    percentile: 'p90',
                }),
            },
            {
                target: 'queries.latencies.p99',
                title: i18n('charts.transaction-latency', {
                    percentile: 'p99',
                }),
            },
        ],
        options: {
            dataType: 'ms',
        },
    },
];
