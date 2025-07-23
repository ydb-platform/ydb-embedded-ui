import React from 'react';

import {Tab, TabList, TabProvider} from '@gravity-ui/uikit';
import {useLocation} from 'react-router-dom';

import {InfoViewer} from '../../../../../components/InfoViewer/InfoViewer';
import {InternalLink} from '../../../../../components/InternalLink';
import {LabelWithPopover} from '../../../../../components/LabelWithPopover';
import {ProgressViewer} from '../../../../../components/ProgressViewer/ProgressViewer';
import {parseQuery} from '../../../../../routes';
import {TENANT_STORAGE_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import {setStorageTab} from '../../../../../store/reducers/tenant/tenant';
import {cn} from '../../../../../utils/cn';
import {formatStorageValues} from '../../../../../utils/dataFormatters/dataFormatters';
import {useTypedDispatch, useTypedSelector} from '../../../../../utils/hooks';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {TenantDashboard} from '../TenantDashboard/TenantDashboard';
import i18n from '../i18n';

import {TopGroups} from './TopGroups';
import {TopTables} from './TopTables';
import {storageDashboardConfig} from './storageDashboardConfig';

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
    const dispatch = useTypedDispatch();
    const location = useLocation();
    const {storageTab = TENANT_STORAGE_TABS_IDS.tables} = useTypedSelector((state) => state.tenant);

    const {blobStorageUsed, tabletStorageUsed, blobStorageLimit, tabletStorageLimit} = metrics;

    const queryParams = parseQuery(location);

    React.useEffect(() => {
        if (!storageTab) {
            dispatch(setStorageTab(TENANT_STORAGE_TABS_IDS.tables));
        }
    }, [storageTab, dispatch]);

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
                <ProgressViewer
                    value={tabletStorageUsed}
                    capacity={tabletStorageLimit}
                    formatValues={formatStorageValues}
                    colorizeProgress={true}
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
                <ProgressViewer
                    value={blobStorageUsed}
                    capacity={blobStorageLimit}
                    formatValues={formatStorageValues}
                    colorizeProgress={true}
                    size="storage"
                />
            ),
        },
    ];

    return (
        <React.Fragment>
            <TenantDashboard database={tenantName} charts={storageDashboardConfig} />
            <InfoViewer
                variant="storage"
                title={i18n('storage.storage-details-title')}
                info={info}
            />

            <div className={tenantStorageCn('tabs-container')}>
                <TabProvider value={storageTab}>
                    <TabList size="m">
                        {storageTabs.map(({id, title}) => {
                            const path = getTenantPath({
                                ...queryParams,
                                [TenantTabsGroups.storageTab]: id,
                            });
                            return (
                                <Tab key={id} value={id}>
                                    <InternalLink to={path} as="tab">
                                        {title}
                                    </InternalLink>
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
