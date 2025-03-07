import React from 'react';

import {InfoViewer} from '../../../../../components/InfoViewer/InfoViewer';
import {LabelWithPopover} from '../../../../../components/LabelWithPopover';
import {ProgressViewer} from '../../../../../components/ProgressViewer/ProgressViewer';
import {formatStorageValues} from '../../../../../utils/dataFormatters/dataFormatters';
import {TenantDashboard} from '../TenantDashboard/TenantDashboard';
import i18n from '../i18n';
import {b} from '../utils';

import {TopGroups} from './TopGroups';
import {TopTables} from './TopTables';
import {storageDashboardConfig} from './storageDashboardConfig';

import '../TenantOverview.scss';

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
                />
            ),
        },
    ];

    return (
        <React.Fragment>
            <TenantDashboard database={tenantName} charts={storageDashboardConfig} />
            <InfoViewer className={b('storage-info')} title="Storage details" info={info} />
            <TopTables database={tenantName} />
            <TopGroups tenant={tenantName} />
        </React.Fragment>
    );
}
