import InfoViewer from '../../../../../components/InfoViewer/InfoViewer';
import {ProgressViewer} from '../../../../../components/ProgressViewer/ProgressViewer';
import {formatStorageValues} from '../../../../../utils/dataFormatters/dataFormatters';

import {TenantDashboard} from '../TenantDashboard/TenantDashboard';

import '../TenantOverview.scss';

import {storageDashboardConfig} from './storageDashboardConfig';
import {TopTables} from './TopTables';
import {TopGroups} from './TopGroups';
import {b} from '../utils';

export interface TenantStorageMetrics {
    blobStorageUsed?: number;
    blobStorageLimit?: number;
    tableStorageUsed?: number;
    tableStorageLimit?: number;
}

interface TenantStorageProps {
    tenantName: string;
    metrics: TenantStorageMetrics;
}

export function TenantStorage({tenantName, metrics}: TenantStorageProps) {
    const {blobStorageUsed, tableStorageUsed, blobStorageLimit, tableStorageLimit} = metrics;

    const info = [
        {
            label: 'Database storage',
            value: (
                <ProgressViewer
                    value={blobStorageUsed}
                    capacity={blobStorageLimit}
                    formatValues={formatStorageValues}
                    colorizeProgress={true}
                    warningThreshold={75}
                    dangerThreshold={85}
                />
            ),
        },
        {
            label: 'Table storage',
            value: (
                <ProgressViewer
                    value={tableStorageUsed}
                    capacity={tableStorageLimit}
                    formatValues={formatStorageValues}
                    colorizeProgress={true}
                    warningThreshold={75}
                    dangerThreshold={85}
                />
            ),
        },
    ];

    return (
        <>
            <TenantDashboard charts={storageDashboardConfig} />
            <InfoViewer className={b('storage-info')} title="Storage details" info={info} />
            <TopTables path={tenantName} />
            <TopGroups tenant={tenantName} />
        </>
    );
}
