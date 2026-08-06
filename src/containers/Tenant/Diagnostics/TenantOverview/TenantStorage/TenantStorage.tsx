import React from 'react';

import {Flex} from '@gravity-ui/uikit';

import {ProgressWrapper} from '../../../../../components/ProgressWrapper';
import type {YDBDefinitionListItem} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../../../../../components/YDBDefinitionList/YDBDefinitionList';
import {useBlobStorageCapacityMetricsEnabled} from '../../../../../store/reducers/capabilities/hooks';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import {cn} from '../../../../../utils/cn';
import {useDiagnosticsPageLinkGetter} from '../../DiagnosticsPages';
import {StatsWrapper} from '../StatsWrapper/StatsWrapper';
import {TenantDashboard} from '../TenantDashboard/TenantDashboard';

import {TenantStorageGroups, getStorageGroupsDefinitionItem} from './TenantStorageGroups';
import {TopGroups} from './TopGroups';
import {TopTables} from './TopTables';
import {formatTenantStorageProgressMetric} from './displayFormatters';
import i18n from './i18n';
import {storageDashboardConfig} from './storageDashboardConfig';
import type {TenantStorageProps} from './types';

const b = cn('ydb-tenant-storage');

export type {TenantStorageMetrics} from './types';

export function TenantStorage({
    allocatedResources,
    database,
    metrics,
    databaseType,
    storageGroupsTotal,
}: TenantStorageProps) {
    const {blobStorageUsed, tabletStorageUsed, blobStorageLimit, tabletStorageLimit} = metrics;
    const getDiagnosticsPageLink = useDiagnosticsPageLinkGetter();
    const capacityMetricsEnabled = useBlobStorageCapacityMetricsEnabled();
    const topGroupsTitle = capacityMetricsEnabled
        ? i18n('title_top-groups-by-vdisk-slot-usage')
        : i18n('title_top-groups-by-usage');

    const items = React.useMemo<YDBDefinitionListItem[]>(() => {
        const storageGroupsDefinitionItem = getStorageGroupsDefinitionItem(
            allocatedResources,
            storageGroupsTotal,
        );

        return [
            {
                name: i18n('title_tablet-storage'),
                note: i18n('context_tablet-storage-description'),
                content: (
                    <ProgressWrapper
                        value={tabletStorageUsed}
                        capacity={tabletStorageLimit}
                        formatValues={formatTenantStorageProgressMetric}
                        withCapacityUsage
                    />
                ),
            },
            {
                name: i18n('title_database-storage'),
                note: i18n('context_database-storage-description'),
                content: (
                    <ProgressWrapper
                        value={blobStorageUsed}
                        capacity={blobStorageLimit}
                        formatValues={formatTenantStorageProgressMetric}
                        withCapacityUsage
                    />
                ),
            },
            ...(storageGroupsDefinitionItem ? [storageGroupsDefinitionItem] : []),
        ];
    }, [
        allocatedResources,
        blobStorageLimit,
        blobStorageUsed,
        storageGroupsTotal,
        tabletStorageLimit,
        tabletStorageUsed,
    ]);

    if (databaseType === 'Serverless') {
        return (
            <Flex direction="column" gap={4}>
                <TenantStorageGroups
                    allocatedResources={allocatedResources}
                    storageGroupsTotal={storageGroupsTotal}
                />
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
            <YDBDefinitionList responsive wrapperClassName={b('details')} items={items} />
            <StatsWrapper title={i18n('title_top-tables-by-size')}>
                <TopTables database={database} />
            </StatsWrapper>
            <StatsWrapper
                title={topGroupsTitle}
                allEntitiesLink={getDiagnosticsPageLink(TENANT_DIAGNOSTICS_TABS_IDS.storage)}
            >
                <TopGroups tenant={database} capacityMetricsEnabled={capacityMetricsEnabled} />
            </StatsWrapper>
        </Flex>
    );
}
