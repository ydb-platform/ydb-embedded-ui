import React from 'react';

import {Tab, TabList, TabProvider} from '@gravity-ui/uikit';

import {InfoViewer} from '../../../../../components/InfoViewer/InfoViewer';
import {LabelWithPopover} from '../../../../../components/LabelWithPopover';
import {TENANT_STORAGE_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import {cn} from '../../../../../utils/cn';
import {formatStorageValues} from '../../../../../utils/dataFormatters/dataFormatters';
import {TenantDashboard} from '../TenantDashboard/TenantDashboard';
import i18n from '../i18n';

import {ProgressWrapper} from './ProgressWrapper';
import {TopGroups} from './TopGroups';
import {TopTables} from './TopTables';
import {storageDashboardConfig} from './storageDashboardConfig';
import {useTenantStorageQueryParams} from './useTenantStorageQueryParams';

import './TenantStorage.scss';

const tenantStorageCn = cn('tenant-storage');

const storageTabs = [
    {id: TENANT_STORAGE_TABS_IDS.tables, title: i18n('title_top-tables-by-size')},
    {id: TENANT_STORAGE_TABS_IDS.groups, title: i18n('title_top-groups-by-usage')},
];

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
    const {storageTab, handleStorageTabChange} = useTenantStorageQueryParams();

    const {blobStorageUsed, tabletStorageUsed, blobStorageLimit, tabletStorageLimit} = metrics;

    const renderTabContent = () => {
        switch (storageTab) {
            case TENANT_STORAGE_TABS_IDS.tables:
                return <TopTables database={tenantName} />;
            case TENANT_STORAGE_TABS_IDS.groups:
                return <TopGroups tenant={tenantName} />;
            default:
                return null;
        }
    };

    const info = [
        {
            label: (
                <LabelWithPopover
                    text={i18n('storage.tablet-storage-title')}
                    popoverContent={i18n('storage.tablet-storage-description')}
                />
            ),
            value: (
                <ProgressWrapper
                    value={tabletStorageUsed}
                    capacity={tabletStorageLimit}
                    formatValues={formatStorageValues}
                    size="storage"
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
                <ProgressWrapper
                    value={blobStorageUsed}
                    capacity={blobStorageLimit}
                    formatValues={formatStorageValues}
                    size="storage"
                />
            ),
        },
    ];

    return (
        <React.Fragment>
            <TenantDashboard database={tenantName} charts={storageDashboardConfig} />
            <InfoViewer variant="small" title={i18n('storage.storage-details-title')} info={info} />

            <div className={tenantStorageCn('tabs-container')}>
                <TabProvider value={storageTab}>
                    <TabList size="m">
                        {storageTabs.map(({id, title}) => {
                            return (
                                <Tab key={id} value={id} onClick={() => handleStorageTabChange(id)}>
                                    {title}
                                </Tab>
                            );
                        })}
                    </TabList>
                </TabProvider>

                <div className={tenantStorageCn('tab-content')}>{renderTabContent()}</div>
            </div>
        </React.Fragment>
    );
}
