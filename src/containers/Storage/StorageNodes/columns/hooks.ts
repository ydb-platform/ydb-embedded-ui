import React from 'react';

import {
    NODES_COLUMNS_IDS,
    NODES_COLUMNS_TITLES,
} from '../../../../components/nodesColumns/constants';
import {VISIBLE_ENTITIES} from '../../../../store/reducers/storage/constants';
import {useSelectedColumns} from '../../../../utils/hooks/useSelectedColumns';

import {getStorageNodesColumns} from './columns';
import {
    DEFAULT_STORAGE_NODES_COLUMNS,
    REQUIRED_STORAGE_NODES_COLUMNS,
    STORAGE_NODES_SELECTED_COLUMNS_LS_KEY,
} from './constants';
import type {GetStorageNodesColumnsParams} from './types';

export function useStorageNodesSelectedColumns({
    visibleEntities,
    database,
    additionalNodesProps,
    viewContext,
    columnsSettings,
}: GetStorageNodesColumnsParams) {
    const columns = React.useMemo(() => {
        return getStorageNodesColumns({
            database,
            additionalNodesProps,
            viewContext,
            columnsSettings,
        });
    }, [database, additionalNodesProps, viewContext, columnsSettings]);

    const requiredColumns = React.useMemo(() => {
        if (visibleEntities === VISIBLE_ENTITIES.missing) {
            return [...REQUIRED_STORAGE_NODES_COLUMNS, NODES_COLUMNS_IDS.Missing];
        }
        return REQUIRED_STORAGE_NODES_COLUMNS;
    }, [visibleEntities]);

    return useSelectedColumns(
        columns,
        STORAGE_NODES_SELECTED_COLUMNS_LS_KEY,
        NODES_COLUMNS_TITLES,
        DEFAULT_STORAGE_NODES_COLUMNS,
        requiredColumns,
    );
}
