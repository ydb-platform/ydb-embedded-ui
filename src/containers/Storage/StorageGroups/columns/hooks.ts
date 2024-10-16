import React from 'react';

import {VISIBLE_ENTITIES} from '../../../../store/reducers/storage/constants';
import {useSelectedColumns} from '../../../../utils/hooks/useSelectedColumns';
import {getRequiredDataFields} from '../../../../utils/tableUtils/getRequiredDataFields';
import type {StorageViewContext} from '../../types';

import {getStorageGroupsColumns} from './columns';
import {
    DEFAULT_STORAGE_GROUPS_COLUMNS,
    GROUPS_COLUMNS_TO_DATA_FIELDS,
    REQUIRED_STORAGE_GROUPS_COLUMNS,
    STORAGE_GROUPS_COLUMNS_IDS,
    STORAGE_GROUPS_COLUMNS_TITLES,
    STORAGE_GROUPS_SELECTED_COLUMNS_LS_KEY,
} from './constants';
import type {GetStorageGroupsColumnsParams} from './types';

export function useGetStorageGroupsColumns(viewContext: StorageViewContext) {
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

    const {columnsToSelect, columnsToShow, setColumns} = useSelectedColumns(
        columns,
        STORAGE_GROUPS_SELECTED_COLUMNS_LS_KEY,
        STORAGE_GROUPS_COLUMNS_TITLES,
        DEFAULT_STORAGE_GROUPS_COLUMNS,
        requiredColumns,
    );

    const dataFieldsRequired = React.useMemo(() => {
        return getRequiredDataFields(columnsToShow, GROUPS_COLUMNS_TO_DATA_FIELDS);
    }, [columnsToShow]);

    return {
        columnsToSelect,
        columnsToShow,
        setColumns,
        dataFieldsRequired,
    };
}
