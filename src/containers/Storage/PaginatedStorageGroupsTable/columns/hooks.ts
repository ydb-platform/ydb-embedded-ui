import React from 'react';

import {
    useBlobStorageCapacityMetricsEnabled,
    useBridgeModeEnabled,
} from '../../../../store/reducers/capabilities/hooks';
import {VISIBLE_ENTITIES} from '../../../../store/reducers/storage/constants';
import {VDisksGroupBy} from '../../../../utils/disks/groupBy';
import {
    useIsUserAllowedToMakeChanges,
    useIsViewerUser,
} from '../../../../utils/hooks/useIsUserAllowedToMakeChanges';
import {
    mergeColumnsPreservingHiddenPositions,
    useSelectedColumns,
} from '../../../../utils/hooks/useSelectedColumns';
import {PDisksGroupBy} from '../../StorageExpertModePanel/constants';
import {
    useIsStorageExpertMode,
    usePDisksGroupByParam,
    useVDisksGroupByParam,
} from '../../useStorageQueryParams';

import {getStorageGroupsColumns} from './columns';
import type {StorageGroupsColumnId} from './constants';
import {
    CAPACITY_METRICS_USER_SETTINGS_COLUMNS_IDS,
    DEFAULT_STORAGE_GROUPS_COLUMNS,
    MONITORING_USER_COLUMNS_IDS,
    REQUIRED_STORAGE_GROUPS_COLUMNS,
    STORAGE_GROUPS_COLUMNS_IDS,
    STORAGE_GROUPS_COLUMNS_TITLES,
    STORAGE_GROUPS_LEGACY_CAPACITY_COLUMN_IDS,
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
    const vdisksGroupBy = useVDisksGroupByParam();
    const pdisksGroupBy = usePDisksGroupByParam();
    const isVDisksPDisksColumnAvailable = Boolean(isUserAllowedToMakeChanges);
    const isAllVDisksLayout = isStorageExpertMode && vdisksGroupBy === VDisksGroupBy.All;
    const isAllPDisksLayout = isStorageExpertMode && pdisksGroupBy === PDisksGroupBy.All;

    const skippedColumnIds = React.useMemo(() => {
        const skipped: StorageGroupsColumnId[] = [];

        if (!bridgeModeEnabled) {
            skipped.push(STORAGE_GROUPS_COLUMNS_IDS.PileName);
        }

        if (!isUserAllowedToMakeChanges) {
            skipped.push(...MONITORING_USER_COLUMNS_IDS);

            if (!isViewerUser) {
                skipped.push(...VIEWER_USER_COLUMNS_IDS);
            }
        }

        return skipped;
    }, [bridgeModeEnabled, isUserAllowedToMakeChanges, isViewerUser]);

    const columns = React.useMemo(() => {
        const allColumns = getStorageGroupsColumns({
            viewContext,
            isAllVDisksLayout,
            isAllPDisksLayout,
        });

        return allColumns.filter((column) => !skippedColumnIds.some((id) => id === column.name));
    }, [isAllPDisksLayout, isAllVDisksLayout, skippedColumnIds, viewContext]);

    const stickyColumns = React.useMemo(() => {
        const sticky = [...REQUIRED_STORAGE_GROUPS_COLUMNS];

        if (visibleEntities === VISIBLE_ENTITIES.missing) {
            sticky.push(STORAGE_GROUPS_COLUMNS_IDS.Degraded);
        }

        if (visibleEntities === VISIBLE_ENTITIES.space && !blobMetricsEnabled) {
            sticky.push(STORAGE_GROUPS_COLUMNS_IDS.DiskSpace);
        }

        return sticky;
    }, [blobMetricsEnabled, visibleEntities]);

    const requiredColumns = React.useMemo(() => {
        return isStorageExpertMode && isVDisksPDisksColumnAvailable
            ? [...stickyColumns, STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks]
            : stickyColumns;
    }, [isStorageExpertMode, isVDisksPDisksColumnAvailable, stickyColumns]);

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

    const selectedColumns = useSelectedColumns(
        columns,
        STORAGE_GROUPS_SELECTED_COLUMNS_LS_KEY,
        STORAGE_GROUPS_COLUMNS_TITLES,
        defaultColumns,
        requiredColumns,
        stickyColumns,
    );

    const shouldUseExpertDisksColumn =
        isStorageExpertMode &&
        isVDisksPDisksColumnAvailable &&
        selectedColumns.columnsToShow.some(
            ({name}) => name === STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks,
        );
    const shouldHideVDisksSelectorOption =
        isStorageExpertMode &&
        isVDisksPDisksColumnAvailable &&
        (!selectedColumns.columnsToShow.some(
            ({name}) => name === STORAGE_GROUPS_COLUMNS_IDS.VDisks,
        ) ||
            shouldUseExpertDisksColumn);

    const hiddenCapacityColumnIds = blobMetricsEnabled
        ? STORAGE_GROUPS_LEGACY_CAPACITY_COLUMN_IDS
        : CAPACITY_METRICS_USER_SETTINGS_COLUMNS_IDS;
    const setColumns: typeof selectedColumns.setColumns = React.useCallback(
        (value) => {
            selectedColumns.setColumns(
                mergeColumnsPreservingHiddenPositions(
                    value,
                    selectedColumns.columnsToSelect,
                    hiddenCapacityColumnIds,
                ),
            );
        },
        [hiddenCapacityColumnIds, selectedColumns],
    );

    return React.useMemo(() => {
        const columnsToShow = selectedColumns.columnsToShow.filter(({name}) => {
            if (hiddenCapacityColumnIds.some((columnId) => columnId === name)) {
                return false;
            }

            return !shouldUseExpertDisksColumn || name !== STORAGE_GROUPS_COLUMNS_IDS.VDisks;
        });
        const columnsToSelect = selectedColumns.columnsToSelect.filter(({id}) => {
            if (hiddenCapacityColumnIds.some((columnId) => columnId === id)) {
                return false;
            }

            return !shouldHideVDisksSelectorOption || id !== STORAGE_GROUPS_COLUMNS_IDS.VDisks;
        });

        return {
            ...selectedColumns,
            columnsToShow,
            columnsToSelect,
            setColumns,
        };
    }, [
        hiddenCapacityColumnIds,
        selectedColumns,
        setColumns,
        shouldHideVDisksSelectorOption,
        shouldUseExpertDisksColumn,
    ]);
}
