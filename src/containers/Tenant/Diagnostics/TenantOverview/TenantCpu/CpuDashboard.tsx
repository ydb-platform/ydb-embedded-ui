import {type ChartConfig, TenantDashboard} from '../TenantDashboard/TenantDashboard';
import i18n from '../i18n';

const cpuDashboardConfig: ChartConfig[] = [
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

export const CpuDashboard = () => {
    return <TenantDashboard charts={cpuDashboardConfig} />;
};
