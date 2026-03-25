import type {ChartConfig} from '../TenantDashboard/TenantDashboard';
import i18n from '../i18n';

export const networkDashboardConfig: ChartConfig[] = [
    {
        title: i18n('charts.network-utilization'),
        metrics: [
            {
                target: 'resources.network.sent_bytes',
                title: i18n('charts.network-sent-bytes'),
            },
            {
                target: 'resources.network.received_bytes',
                title: i18n('charts.network-received-bytes'),
            },
        ],
        options: {
            dataType: 'size',
            showLegend: true,
        },
    },
];
