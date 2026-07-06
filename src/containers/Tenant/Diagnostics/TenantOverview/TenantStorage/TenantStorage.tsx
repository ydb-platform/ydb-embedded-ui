import {Flex} from '@gravity-ui/uikit';

import {InfoViewer} from '../../../../../components/InfoViewer/InfoViewer';
import {LabelWithPopover} from '../../../../../components/LabelWithPopover';
import {ProgressWrapper} from '../../../../../components/ProgressWrapper';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import {useDiagnosticsPageLinkGetter} from '../../DiagnosticsPages';
import {StatsWrapper} from '../StatsWrapper/StatsWrapper';
import {TenantDashboard} from '../TenantDashboard/TenantDashboard';

import {TopGroups} from './TopGroups';
import {TopTables} from './TopTables';
import {formatTenantStorageProgressMetric} from './displayFormatters';
import i18n from './i18n';
import {storageDashboardConfig} from './storageDashboardConfig';
import type {TenantStorageProps} from './types';

export type {TenantStorageMetrics} from './types';

export function TenantStorage({database, metrics, databaseType}: TenantStorageProps) {
    const {blobStorageUsed, tabletStorageUsed, blobStorageLimit, tabletStorageLimit} = metrics;
    const getDiagnosticsPageLink = useDiagnosticsPageLinkGetter();

    const info = [
        {
            label: (
                <LabelWithPopover
                    text={i18n('title_tablet-storage')}
                    popoverContent={i18n('context_tablet-storage-description')}
                />
            ),
            value: (
                <ProgressWrapper
                    value={tabletStorageUsed}
                    capacity={tabletStorageLimit}
                    formatValues={formatTenantStorageProgressMetric}
                    withCapacityUsage
                />
            ),
        },
        {
            label: (
                <LabelWithPopover
                    text={i18n('title_database-storage')}
                    popoverContent={i18n('context_database-storage-description')}
                />
            ),
            value: (
                <ProgressWrapper
                    value={blobStorageUsed}
                    capacity={blobStorageLimit}
                    formatValues={formatTenantStorageProgressMetric}
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
                    allEntitiesLink={getDiagnosticsPageLink(TENANT_DIAGNOSTICS_TABS_IDS.storage)}
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
                allEntitiesLink={getDiagnosticsPageLink(TENANT_DIAGNOSTICS_TABS_IDS.storage)}
            >
                <TopGroups tenant={database} />
            </StatsWrapper>
        </Flex>
    );
}
