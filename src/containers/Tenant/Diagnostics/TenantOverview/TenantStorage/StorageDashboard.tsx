import {type ChartConfig, TenantDashboard} from '../TenantDashboard/TenantDashboard';
import i18n from '../i18n';

const storageDashboardConfig: ChartConfig[] = [
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

export const StorageDashboard = () => {
    return <TenantDashboard charts={storageDashboardConfig} />;
};
