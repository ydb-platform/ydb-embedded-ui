import React from 'react';

import {ResizeableDataTable} from '../../../../../components/ResizeableDataTable/ResizeableDataTable';
import {
    useCapabilitiesLoaded,
    useStorageGroupsHandlerAvailable,
} from '../../../../../store/reducers/capabilities/hooks';
import {storageApi} from '../../../../../store/reducers/storage/storage';
import type {GroupsRequiredField} from '../../../../../types/api/storage';
import {
    TENANT_OVERVIEW_TABLES_LIMIT,
    TENANT_OVERVIEW_TABLES_SETTINGS,
} from '../../../../../utils/constants';
import {useAutoRefreshInterval} from '../../../../../utils/hooks';
import {getRequiredDataFields} from '../../../../../utils/tableUtils/getRequiredDataFields';
import {getStorageTopGroupsColumns} from '../../../../Storage/PaginatedStorageGroupsTable/columns/columns';
import {
    GROUPS_COLUMNS_TO_DATA_FIELDS,
    STORAGE_GROUPS_COLUMNS_WIDTH_LS_KEY,
} from '../../../../Storage/PaginatedStorageGroupsTable/columns/constants';
import type {StorageGroupsColumn} from '../../../../Storage/PaginatedStorageGroupsTable/columns/types';
import {TenantOverviewTableLayout} from '../TenantOverviewTableLayout';

export interface TopGroupsTableConfig {
    columns: StorageGroupsColumn[];
    fieldsRequired: GroupsRequiredField[];
    sort: '-Usage' | '-MaxVDiskSlotUsage';
}

export function getTopGroupsTableConfig(capacityMetricsEnabled: boolean): TopGroupsTableConfig {
    const columns = getStorageTopGroupsColumns(capacityMetricsEnabled);
    const columnsIds = columns.map(({name}) => name);

    return {
        columns,
        fieldsRequired: getRequiredDataFields(columnsIds, GROUPS_COLUMNS_TO_DATA_FIELDS),
        sort: capacityMetricsEnabled ? '-MaxVDiskSlotUsage' : '-Usage',
    };
}

interface TopGroupsProps {
    tenant?: string;
    capacityMetricsEnabled: boolean;
}

export function TopGroups({tenant, capacityMetricsEnabled}: TopGroupsProps) {
    const capabilitiesLoaded = useCapabilitiesLoaded();
    const groupsHandlerAvailable = useStorageGroupsHandlerAvailable();
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {columns, fieldsRequired, sort} = React.useMemo(
        () => getTopGroupsTableConfig(capacityMetricsEnabled),
        [capacityMetricsEnabled],
    );

    const {currentData, isFetching, error} = storageApi.useGetStorageGroupsInfoQuery(
        {
            database: tenant,
            sort,
            with: 'all',
            limit: TENANT_OVERVIEW_TABLES_LIMIT,
            shouldUseGroupsHandler: groupsHandlerAvailable,
            fieldsRequired,
        },
        {
            pollingInterval: autoRefreshInterval,
            skip: !capabilitiesLoaded,
        },
    );

    const loading = isFetching && currentData === undefined;

    const groups = currentData?.groups || [];

    return (
        <TenantOverviewTableLayout
            loading={loading || !capabilitiesLoaded}
            error={error}
            withData={Boolean(currentData)}
        >
            <ResizeableDataTable
                columnsWidthLSKey={STORAGE_GROUPS_COLUMNS_WIDTH_LS_KEY}
                data={groups}
                columns={columns}
                settings={TENANT_OVERVIEW_TABLES_SETTINGS}
            />
        </TenantOverviewTableLayout>
    );
}
