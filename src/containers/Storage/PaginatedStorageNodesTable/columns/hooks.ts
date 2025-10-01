import React from 'react';

import {
    NODES_COLUMNS_IDS,
    NODES_COLUMNS_TITLES,
} from '../../../../components/nodesColumns/constants';
import {useBridgeModeEnabled} from '../../../../store/reducers/capabilities/hooks';
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
    viewContext,
    columnsSettings,
}: GetStorageNodesColumnsParams) {
    const bridgeModeEnabled = useBridgeModeEnabled();

    const columns = React.useMemo(() => {
        const all = getStorageNodesColumns({
            database,
            viewContext,
            columnsSettings,
        });
        return bridgeModeEnabled ? all : all.filter((c) => c.name !== NODES_COLUMNS_IDS.PileName);
    }, [database, viewContext, columnsSettings, bridgeModeEnabled]);

    const requiredColumns = React.useMemo(() => {
        if (visibleEntities === VISIBLE_ENTITIES.missing) {
            return [...REQUIRED_STORAGE_NODES_COLUMNS, NODES_COLUMNS_IDS.Missing];
        }
        return REQUIRED_STORAGE_NODES_COLUMNS;
    }, [visibleEntities]);

    const defaultColumns = React.useMemo(() => {
        if (!bridgeModeEnabled) {
            return DEFAULT_STORAGE_NODES_COLUMNS;
        }
        return DEFAULT_STORAGE_NODES_COLUMNS.includes(NODES_COLUMNS_IDS.PileName)
            ? DEFAULT_STORAGE_NODES_COLUMNS
            : [...DEFAULT_STORAGE_NODES_COLUMNS, NODES_COLUMNS_IDS.PileName];
    }, [bridgeModeEnabled]);

    return useSelectedColumns(
        columns,
        STORAGE_NODES_SELECTED_COLUMNS_LS_KEY,
        NODES_COLUMNS_TITLES,
        defaultColumns,
        requiredColumns,
    );
}
