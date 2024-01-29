import cn from 'bem-cn-lite';

import InfoViewer from '../../../../../components/InfoViewer/InfoViewer';
import {ProgressViewer} from '../../../../../components/ProgressViewer/ProgressViewer';
import {formatStorageValues} from '../../../../../utils/dataFormatters/dataFormatters';
import {getSizeWithSignificantDigits} from '../../../../../utils/bytesParsers';

import {TenantDashboard} from '../TenantDashboard/TenantDashboard';

import '../TenantOverview.scss';

import {storageDashboardConfig} from './storageDashboardConfig';
import {TopTables} from './TopTables';
import {TopGroups} from './TopGroups';

const b = cn('tenant-overview');

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
    const formatValues = (value?: number, total?: number) => {
        const size = getSizeWithSignificantDigits(Number(blobStorageLimit || blobStorageUsed), 0);

        return formatStorageValues(value, total, size);
    };

    const info = [
        {
            label: 'Database storage',
            value: (
                <ProgressViewer
                    value={blobStorageUsed}
                    capacity={blobStorageLimit}
                    formatValues={formatValues}
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
                    formatValues={formatValues}
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
