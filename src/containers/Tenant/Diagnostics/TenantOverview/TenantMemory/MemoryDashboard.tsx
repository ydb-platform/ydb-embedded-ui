import {type ChartConfig, TenantDashboard} from '../TenantDashboard/TenantDashboard';
import i18n from '../i18n';

const memoryDashboardConfig: ChartConfig[] = [
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

export const MemoryDashboard = () => {
    return <TenantDashboard charts={memoryDashboardConfig} />;
};
