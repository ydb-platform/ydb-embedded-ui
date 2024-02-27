import InfoViewer from '../../../../../components/InfoViewer/InfoViewer';
import {ProgressViewer} from '../../../../../components/ProgressViewer/ProgressViewer';
import {LabelWithPopover} from '../../../../../components/LabelWithPopover';
import {formatStorageValues} from '../../../../../utils/dataFormatters/dataFormatters';

import {TenantDashboard} from '../TenantDashboard/TenantDashboard';

import '../TenantOverview.scss';

import {storageDashboardConfig} from './storageDashboardConfig';
import {TopTables} from './TopTables';
import {TopGroups} from './TopGroups';
import {b} from '../utils';
import i18n from '../i18n';

export interface TenantStorageMetrics {
    blobStorageUsed?: number;
    blobStorageLimit?: number;
    tabletStorageUsed?: number;
    tabletStorageLimit?: number;
}

interface TenantStorageProps {
    tenantName: string;
    metrics: TenantStorageMetrics;
}

export function TenantStorage({tenantName, metrics}: TenantStorageProps) {
    const {blobStorageUsed, tabletStorageUsed, blobStorageLimit, tabletStorageLimit} = metrics;

    const info = [
        {
            label: (
                <LabelWithPopover
                    text={i18n('storage.tablet-storage-title')}
                    popoverContent={i18n('storage.tablet-storage-description')}
                />
            ),
            value: (
                <ProgressViewer
                    value={tabletStorageUsed}
                    capacity={tabletStorageLimit}
                    formatValues={formatStorageValues}
                    colorizeProgress={true}
                    warningThreshold={75}
                    dangerThreshold={85}
                />
            ),
        },
        {
            label: (
                <LabelWithPopover
                    text={i18n('storage.db-storage-title')}
                    popoverContent={i18n('storage.db-storage-description')}
                />
            ),
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
