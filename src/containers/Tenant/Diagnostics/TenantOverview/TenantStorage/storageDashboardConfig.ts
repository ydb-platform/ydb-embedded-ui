import type {ChartConfig} from '../TenantDashboard/TenantDashboard';
import i18n from '../i18n';

export const storageDashboardConfig: ChartConfig[] = [
    {
        title: i18n('charts.storage-usage'),
        metrics: [
            {
                target: 'resources.storage.used_bytes',
                title: i18n('charts.storage-usage'),
            },
        ],
        options: {
            dataType: 'size',
        },
    },
];
