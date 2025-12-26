import React from 'react';

import type {NodesColumnId} from '../../../../components/nodesColumns/constants';
import {
    NODES_COLUMNS_IDS,
    NODES_COLUMNS_TITLES,
} from '../../../../components/nodesColumns/constants';
import {
    useBlobStorageCapacityMetricsEnabled,
    useBridgeModeEnabled,
} from '../../../../store/reducers/capabilities/hooks';
import {VISIBLE_ENTITIES} from '../../../../store/reducers/storage/constants';
import {useSelectedColumns} from '../../../../utils/hooks/useSelectedColumns';

import {getStorageNodesColumns} from './columns';
import {
    CAPACITY_METRICS_USER_SETTINGS_COLUMNS_IDS,
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
    const blobMetricsEnabled = useBlobStorageCapacityMetricsEnabled();

    const skippedColumnIds = React.useMemo(() => {
        const skipped: string[] = [];

        if (!bridgeModeEnabled) {
            skipped.push(NODES_COLUMNS_IDS.PileName);
        }

        if (!blobMetricsEnabled) {
            skipped.push(...CAPACITY_METRICS_USER_SETTINGS_COLUMNS_IDS);
        }

        return skipped;
    }, [bridgeModeEnabled, blobMetricsEnabled]);

    const columns = React.useMemo(() => {
        const allColumns = getStorageNodesColumns({database, viewContext, columnsSettings});

        return allColumns.filter(
            (column) => !skippedColumnIds.includes(column.name as NodesColumnId),
        );
    }, [database, viewContext, columnsSettings, skippedColumnIds]);

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
