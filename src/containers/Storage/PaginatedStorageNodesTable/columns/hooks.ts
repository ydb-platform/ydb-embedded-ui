import React from 'react';

import {
    NODES_COLUMNS_IDS,
    NODES_COLUMNS_TITLES,
} from '../../../../components/nodesColumns/constants';
import {useBridgeModeEnabled} from '../../../../store/reducers/capabilities/hooks';
import {SETTING_KEYS} from '../../../../store/reducers/settings/constants';
import {VISIBLE_ENTITIES} from '../../../../store/reducers/storage/constants';
import {useSetting} from '../../../../utils/hooks';
import {useSelectedColumns} from '../../../../utils/hooks/useSelectedColumns';

import {getStorageNodesColumns} from './columns';
import {
    DEFAULT_STORAGE_NODES_COLUMNS,
    REQUIRED_STORAGE_NODES_COLUMNS,
    STORAGE_NODES_SELECTED_COLUMNS_LS_KEY,
    isCapacityMetricsUserNodesColumn,
} from './constants';
import type {GetStorageNodesColumnsParams} from './types';

export function useStorageNodesSelectedColumns({
    visibleEntities,
    database,
    viewContext,
    columnsSettings,
}: GetStorageNodesColumnsParams) {
    const bridgeModeEnabled = useBridgeModeEnabled();
    const [blobMetricsEnabled] = useSetting<boolean>(
        SETTING_KEYS.ENABLE_BLOB_STORAGE_CAPACITY_METRICS,
        false,
    );

    const columns = React.useMemo(() => {
        const all = getStorageNodesColumns({
            database,
            viewContext,
            columnsSettings,
        });

        const filteredByBridge = bridgeModeEnabled
            ? all
            : all.filter((column) => column.name !== NODES_COLUMNS_IDS.PileName);

        const filteredByBlobMetrics = blobMetricsEnabled
            ? filteredByBridge
            : filteredByBridge.filter((column) => !isCapacityMetricsUserNodesColumn(column.name));

        return filteredByBlobMetrics;
    }, [database, viewContext, columnsSettings, bridgeModeEnabled, blobMetricsEnabled]);

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
