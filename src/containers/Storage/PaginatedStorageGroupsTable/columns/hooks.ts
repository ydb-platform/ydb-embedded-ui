import React from 'react';

import {useBridgeModeEnabled} from '../../../../store/reducers/capabilities/hooks';
import {VISIBLE_ENTITIES} from '../../../../store/reducers/storage/constants';
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

    const [highlightedVDisk, setHighlightedVDisk] = React.useState<string | undefined>();

    const [highlightedVDisksVDisk, setHighlightedVDisksVDisk] = React.useState<
        string | undefined
    >();

    const columns = React.useMemo(() => {
        const allColumns = getStorageGroupsColumns({
            viewContext,
            highlightedVDisk,
            setHighlightedVDisk,
            highlightedVDisksVDisk,
            setHighlightedVDisksVDisk,
        });
        const filteredByBridge = bridgeModeEnabled
            ? allColumns
            : allColumns.filter((c) => c.name !== STORAGE_GROUPS_COLUMNS_IDS.PileName);

        if (isUserAllowedToMakeChanges) {
            return filteredByBridge;
        }
        const filteredColumns = filteredByBridge.filter(
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
        highlightedVDisk,
        setHighlightedVDisk,
        highlightedVDisksVDisk,
        setHighlightedVDisksVDisk,
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
