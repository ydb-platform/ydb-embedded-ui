import React from 'react';

import {useBridgeModeEnabled} from '../../../../store/reducers/capabilities/hooks';
import {SETTING_KEYS} from '../../../../store/reducers/settings/constants';
import {VISIBLE_ENTITIES} from '../../../../store/reducers/storage/constants';
import {useSetting} from '../../../../utils/hooks';
import {
    useIsUserAllowedToMakeChanges,
    useIsViewerUser,
} from '../../../../utils/hooks/useIsUserAllowedToMakeChanges';
import {useSelectedColumns} from '../../../../utils/hooks/useSelectedColumns';

import {getStorageGroupsColumns} from './columns';
import {
    DEFAULT_STORAGE_GROUPS_COLUMNS,
    REQUIRED_STORAGE_GROUPS_COLUMNS,
    STORAGE_GROUPS_COLUMNS_IDS,
    STORAGE_GROUPS_COLUMNS_TITLES,
    STORAGE_GROUPS_SELECTED_COLUMNS_LS_KEY,
    isCapacityMetricsUserGroupsColumn,
    isMonitoringUserGroupsColumn,
    isViewerGroupsColumn,
} from './constants';
import type {GetStorageGroupsColumnsParams} from './types';

export function useStorageGroupsSelectedColumns({
    visibleEntities,
    viewContext,
}: GetStorageGroupsColumnsParams) {
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();
    const isViewerUser = useIsViewerUser();
    const bridgeModeEnabled = useBridgeModeEnabled();
    const [blobMetricsEnabled] = useSetting<boolean>(
        SETTING_KEYS.ENABLE_BLOB_STORAGE_CAPACITY_METRICS,
        false,
    );

    const columns = React.useMemo(() => {
        const allColumns = getStorageGroupsColumns({viewContext});
        const filteredByBridge = bridgeModeEnabled
            ? allColumns
            : allColumns.filter((column) => column.name !== STORAGE_GROUPS_COLUMNS_IDS.PileName);

        const filteredByCapacityMetrics = blobMetricsEnabled
            ? filteredByBridge
            : filteredByBridge.filter((column) => !isCapacityMetricsUserGroupsColumn(column.name));

        if (isUserAllowedToMakeChanges) {
            return filteredByCapacityMetrics;
        }
        const filteredColumns = filteredByCapacityMetrics.filter(
            (column) => !isMonitoringUserGroupsColumn(column.name),
        );

        if (isViewerUser) {
            return filteredColumns;
        }

        return filteredColumns.filter((column) => !isViewerGroupsColumn(column.name));
    }, [
        isUserAllowedToMakeChanges,
        viewContext,
        isViewerUser,
        bridgeModeEnabled,
        blobMetricsEnabled,
    ]);

    const requiredColumns = React.useMemo(() => {
        if (visibleEntities === VISIBLE_ENTITIES.missing) {
            return [...REQUIRED_STORAGE_GROUPS_COLUMNS, STORAGE_GROUPS_COLUMNS_IDS.Degraded];
        }

        if (visibleEntities === VISIBLE_ENTITIES.space) {
            return [...REQUIRED_STORAGE_GROUPS_COLUMNS, STORAGE_GROUPS_COLUMNS_IDS.DiskSpace];
        }

        return REQUIRED_STORAGE_GROUPS_COLUMNS;
    }, [visibleEntities]);

    const defaultColumns = React.useMemo(() => {
        if (!bridgeModeEnabled) {
            return DEFAULT_STORAGE_GROUPS_COLUMNS;
        }
        return DEFAULT_STORAGE_GROUPS_COLUMNS.includes(STORAGE_GROUPS_COLUMNS_IDS.PileName)
            ? DEFAULT_STORAGE_GROUPS_COLUMNS
            : [...DEFAULT_STORAGE_GROUPS_COLUMNS, STORAGE_GROUPS_COLUMNS_IDS.PileName];
    }, [bridgeModeEnabled]);

    return useSelectedColumns(
        columns,
        STORAGE_GROUPS_SELECTED_COLUMNS_LS_KEY,
        STORAGE_GROUPS_COLUMNS_TITLES,
        defaultColumns,
        requiredColumns,
    );
}
