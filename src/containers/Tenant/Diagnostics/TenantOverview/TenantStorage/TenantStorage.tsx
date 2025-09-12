import {Flex} from '@gravity-ui/uikit';

import {InfoViewer} from '../../../../../components/InfoViewer/InfoViewer';
import {LabelWithPopover} from '../../../../../components/LabelWithPopover';
import {ProgressWrapper} from '../../../../../components/ProgressWrapper';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {ETenantType} from '../../../../../types/api/tenant';
import {formatStorageValues} from '../../../../../utils/dataFormatters/dataFormatters';
import {useSearchQuery} from '../../../../../utils/hooks';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {StatsWrapper} from '../StatsWrapper/StatsWrapper';
import {TenantDashboard} from '../TenantDashboard/TenantDashboard';
import i18n from '../i18n';

import {TopGroups} from './TopGroups';
import {TopTables} from './TopTables';
import {storageDashboardConfig} from './storageDashboardConfig';

export interface TenantStorageMetrics {
    blobStorageUsed?: number;
    blobStorageLimit?: number;
    tabletStorageUsed?: number;
    tabletStorageLimit?: number;
}

interface TenantStorageProps {
    database: string;
    metrics: TenantStorageMetrics;
    databaseType?: ETenantType;
}

export function TenantStorage({database, metrics, databaseType}: TenantStorageProps) {
    const {blobStorageUsed, tabletStorageUsed, blobStorageLimit, tabletStorageLimit} = metrics;
    const query = useSearchQuery();

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
                    withCapacityUsage
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
                    withCapacityUsage
                />
            ),
        },
    ];

    if (databaseType === 'Serverless') {
        return (
            <Flex direction="column" gap={4}>
                <StatsWrapper
                    title={i18n('title_top-tables-by-size')}
                    allEntitiesLink={getTenantPath({
                        ...query,
                        [TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.storage,
                    })}
                >
                    <TopTables database={database} />
                </StatsWrapper>
            </Flex>
        );
    }

    return (
        <Flex direction="column" gap={4}>
            <TenantDashboard database={database} charts={storageDashboardConfig} />
            <InfoViewer variant="small" title={i18n('title_storage-details')} info={info} />
            <StatsWrapper title={i18n('title_top-tables-by-size')}>
                <TopTables database={database} />
            </StatsWrapper>
            <StatsWrapper
                title={i18n('title_top-groups-by-usage')}
                allEntitiesLink={getTenantPath({
                    ...query,
                    [TenantTabsGroups.diagnosticsTab]: TENANT_DIAGNOSTICS_TABS_IDS.storage,
                })}
            >
                <TopGroups tenant={database} />
            </StatsWrapper>
        </Flex>
    );
}
