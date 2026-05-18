import type {ChartConfig} from '../TenantDashboard/TenantDashboard';

import i18n from './i18n';

export const storageDashboardConfig: ChartConfig[] = [
    {
        title: i18n('title_tablet-storage-usage'),
        metrics: [
            {
                target: 'resources.storage.used_bytes',
                title: i18n('title_tablet-storage-usage'),
            },
        ],
        options: {
            dataType: 'size',
        },
    },
];
