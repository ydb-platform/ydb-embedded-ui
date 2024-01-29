import type {ChartConfig} from '../TenantDashboard/TenantDashboard';
import i18n from '../i18n';

export const memoryDashboardConfig: ChartConfig[] = [
    {
        title: i18n('charts.memory-usage'),
        metrics: [
            {
                target: 'resources.memory.used_bytes',
                title: i18n('charts.memory-usage'),
            },
        ],
        options: {
            dataType: 'size',
        },
    },
];
