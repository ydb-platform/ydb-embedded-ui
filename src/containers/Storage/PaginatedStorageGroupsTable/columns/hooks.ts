import React from 'react';

import {
    useBlobStorageCapacityMetricsEnabled,
    useBridgeModeEnabled,
} from '../../../../store/reducers/capabilities/hooks';
import {VISIBLE_ENTITIES} from '../../../../store/reducers/storage/constants';
import {
    useIsUserAllowedToMakeChanges,
    useIsViewerUser,
} from '../../../../utils/hooks/useIsUserAllowedToMakeChanges';
import {useSelectedColumns} from '../../../../utils/hooks/useSelectedColumns';
import {useIsStorageExpertMode} from '../../useStorageQueryParams';

import {getStorageGroupsColumns} from './columns';
import type {StorageGroupsColumnId} from './constants';
import {
    CAPACITY_METRICS_USER_SETTINGS_COLUMNS_IDS,
    DEFAULT_STORAGE_GROUPS_COLUMNS,
    MONITORING_USER_COLUMNS_IDS,
    REQUIRED_STORAGE_GROUPS_COLUMNS,
    STORAGE_GROUPS_COLUMNS_IDS,
    STORAGE_GROUPS_COLUMNS_TITLES,
    STORAGE_GROUPS_SELECTED_COLUMNS_LS_KEY,
    VIEWER_USER_COLUMNS_IDS,
} from './constants';
import type {GetStorageGroupsColumnsParams} from './types';

export function useStorageGroupsSelectedColumns({
    visibleEntities,
    viewContext,
}: GetStorageGroupsColumnsParams) {
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();
    const isViewerUser = useIsViewerUser();
    const bridgeModeEnabled = useBridgeModeEnabled();
    const blobMetricsEnabled = useBlobStorageCapacityMetricsEnabled();
    const isStorageExpertMode = useIsStorageExpertMode();

    const skippedColumnIds = React.useMemo(() => {
        const skipped: StorageGroupsColumnId[] = [];

        if (!bridgeModeEnabled) {
            skipped.push(STORAGE_GROUPS_COLUMNS_IDS.PileName);
        }

        if (!blobMetricsEnabled) {
            skipped.push(...CAPACITY_METRICS_USER_SETTINGS_COLUMNS_IDS);
        }

        if (blobMetricsEnabled) {
            skipped.push(STORAGE_GROUPS_COLUMNS_IDS.Usage);
        }

        if (!isUserAllowedToMakeChanges) {
            skipped.push(...MONITORING_USER_COLUMNS_IDS);

            if (!isViewerUser) {
                skipped.push(...VIEWER_USER_COLUMNS_IDS);
            }
        }

        const isVDisksPDisksColumnAvailable = !skipped.includes(
            STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks,
        );

        if (isStorageExpertMode && isVDisksPDisksColumnAvailable) {
            skipped.push(STORAGE_GROUPS_COLUMNS_IDS.VDisks);
        }

        return skipped;
    }, [
        bridgeModeEnabled,
        blobMetricsEnabled,
        isUserAllowedToMakeChanges,
        isStorageExpertMode,
        isViewerUser,
    ]);

    const columns = React.useMemo(() => {
        const allColumns = getStorageGroupsColumns({viewContext});

        return allColumns.filter((column) => !skippedColumnIds.some((id) => id === column.name));
    }, [viewContext, skippedColumnIds]);

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
        const defaultStorageGroupsColumns = isStorageExpertMode
            ? [...DEFAULT_STORAGE_GROUPS_COLUMNS, STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks]
            : DEFAULT_STORAGE_GROUPS_COLUMNS;

        if (!bridgeModeEnabled) {
            return defaultStorageGroupsColumns;
        }
        return defaultStorageGroupsColumns.includes(STORAGE_GROUPS_COLUMNS_IDS.PileName)
            ? defaultStorageGroupsColumns
            : [...defaultStorageGroupsColumns, STORAGE_GROUPS_COLUMNS_IDS.PileName];
    }, [bridgeModeEnabled, isStorageExpertMode]);

    return useSelectedColumns(
        columns,
        STORAGE_GROUPS_SELECTED_COLUMNS_LS_KEY,
        STORAGE_GROUPS_COLUMNS_TITLES,
        defaultColumns,
        requiredColumns,
    );
}
