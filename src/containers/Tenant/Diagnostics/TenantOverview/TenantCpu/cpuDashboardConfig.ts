import type {ChartConfig} from '../TenantDashboard/TenantDashboard';
import i18n from '../i18n';

export const cpuDashboardConfig: ChartConfig[] = [
    {
        title: i18n('charts.cpu-usage'),
        metrics: [
            {
                target: 'resources.cpu.usage',
                title: i18n('charts.cpu-usage'),
            },
        ],
    },
];
