import React from 'react';

import {VISIBLE_ENTITIES} from '../../../../store/reducers/storage/constants';
import {useSelectedColumns} from '../../../../utils/hooks/useSelectedColumns';

import {getPreparedStorageNodesColumns} from './columns';
import {
    DEFAULT_STORAGE_NODES_COLUMNS,
    REQUIRED_STORAGE_NODES_COLUMNS,
    STORAGE_NODES_COLUMNS_IDS,
    STORAGE_NODES_COLUMNS_TITLES,
    STORAGE_NODES_SELECTED_COLUMNS_LS_KEY,
} from './constants';
import type {GetStorageNodesColumnsParams} from './types';

export function useStorageNodesSelectedColumns({
    visibleEntities,
    database,
    additionalNodesProps,
}: GetStorageNodesColumnsParams) {
    const columns = React.useMemo(() => {
        return getPreparedStorageNodesColumns({database, additionalNodesProps});
    }, [database, additionalNodesProps]);

    const requiredColumns = React.useMemo(() => {
        if (visibleEntities === VISIBLE_ENTITIES.missing) {
            return [...REQUIRED_STORAGE_NODES_COLUMNS, STORAGE_NODES_COLUMNS_IDS.Missing];
        }
        return REQUIRED_STORAGE_NODES_COLUMNS;
    }, [visibleEntities]);

    return useSelectedColumns(
        columns,
        STORAGE_NODES_SELECTED_COLUMNS_LS_KEY,
        STORAGE_NODES_COLUMNS_TITLES,
        DEFAULT_STORAGE_NODES_COLUMNS,
        requiredColumns,
    );
}
