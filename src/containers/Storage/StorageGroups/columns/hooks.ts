import React from 'react';

import {VISIBLE_ENTITIES} from '../../../../store/reducers/storage/constants';
import {useSelectedColumns} from '../../../../utils/hooks/useSelectedColumns';
import type {StorageViewContext} from '../../types';

import {getStorageGroupsColumns} from './columns';
import {
    DEFAULT_STORAGE_GROUPS_COLUMNS,
    REQUIRED_STORAGE_GROUPS_COLUMNS,
    STORAGE_GROUPS_COLUMNS_IDS,
    STORAGE_GROUPS_COLUMNS_TITLES,
    STORAGE_GROUPS_SELECTED_COLUMNS_LS_KEY,
} from './constants';
import type {GetStorageGroupsColumnsParams} from './types';

export function useGetStorageGroupsColumns(viewContext?: StorageViewContext) {
    return React.useMemo(() => {
        return getStorageGroupsColumns({viewContext});
    }, [viewContext]);
}

export function useStorageGroupsSelectedColumns({
    visibleEntities,
    viewContext,
}: GetStorageGroupsColumnsParams) {
    const columns = useGetStorageGroupsColumns(viewContext);

    const requiredColumns = React.useMemo(() => {
        if (visibleEntities === VISIBLE_ENTITIES.missing) {
            return [...REQUIRED_STORAGE_GROUPS_COLUMNS, STORAGE_GROUPS_COLUMNS_IDS.Degraded];
        }

        if (visibleEntities === VISIBLE_ENTITIES.space) {
            return [...REQUIRED_STORAGE_GROUPS_COLUMNS, STORAGE_GROUPS_COLUMNS_IDS.DiskSpace];
        }

        return REQUIRED_STORAGE_GROUPS_COLUMNS;
    }, [visibleEntities]);

    return useSelectedColumns(
        columns,
        STORAGE_GROUPS_SELECTED_COLUMNS_LS_KEY,
        STORAGE_GROUPS_COLUMNS_TITLES,
        DEFAULT_STORAGE_GROUPS_COLUMNS,
        requiredColumns,
    );
}
