import React from 'react';

import {
    NODES_COLUMNS_IDS,
    isMonitoringUserNodesColumn,
    isViewerUserNodesColumn,
} from '../../components/nodesColumns/constants';
import type {NodesColumnId} from '../../components/nodesColumns/constants';
import type {NodesColumn} from '../../components/nodesColumns/types';
import {useBridgeModeEnabled} from '../../store/reducers/capabilities/hooks';
import type {NodesGroupByField} from '../../types/api/nodes';
import {
    useIsUserAllowedToMakeChanges,
    useIsViewerUser,
} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {useStorageColumnsSettings} from '../Storage/utils';

import {PaginatedNodes} from './PaginatedNodes';
import {
    ALL_NODES_GROUP_BY_PARAMS,
    DEFAULT_NODES_COLUMNS,
    NODES_TABLE_SELECTED_COLUMNS_LS_KEY,
    REQUIRED_NODES_COLUMNS,
} from './columns/constants';
import {useGetNodesColumns} from './columns/hooks';

import './Nodes.scss';

export interface NodesProps {
    path?: string;
    database?: string;
    databaseFullPath?: string;
    scrollContainerRef: React.RefObject<HTMLElement>;
    withPeerRoleFilter?: boolean;
    columns?: NodesColumn[];
    defaultColumnsIds?: NodesColumnId[];
    requiredColumnsIds?: NodesColumnId[];
    selectedColumnsKey?: string;
    groupByParams?: NodesGroupByField[];
}

export function Nodes({
    path,
    database,
    databaseFullPath,
    scrollContainerRef,
    withPeerRoleFilter,
    columns: externalColumns,
    defaultColumnsIds = DEFAULT_NODES_COLUMNS,
    requiredColumnsIds = REQUIRED_NODES_COLUMNS,
    selectedColumnsKey = NODES_TABLE_SELECTED_COLUMNS_LS_KEY,
    groupByParams = ALL_NODES_GROUP_BY_PARAMS,
}: NodesProps) {
    const {handleDataFetched, columnsSettings} = useStorageColumnsSettings();

    const columns = useGetNodesColumns({columns: externalColumns, database, columnsSettings});

    const bridgeModeEnabled = useBridgeModeEnabled();

    const columnsWithPile = React.useMemo(() => {
        return bridgeModeEnabled
            ? columns
            : columns.filter((c) => c.name !== NODES_COLUMNS_IDS.PileName);
    }, [bridgeModeEnabled, columns]);

    const effectiveDefaultColumns = React.useMemo(() => {
        if (!bridgeModeEnabled) {
            return defaultColumnsIds;
        }
        return defaultColumnsIds.includes(NODES_COLUMNS_IDS.PileName)
            ? defaultColumnsIds
            : [...defaultColumnsIds, NODES_COLUMNS_IDS.PileName];
    }, [bridgeModeEnabled, defaultColumnsIds]);
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();
    const isViewerUser = useIsViewerUser();

    const preparedColumns = React.useMemo(() => {
        if (isUserAllowedToMakeChanges) {
            return columnsWithPile;
        }
        const filteredColumns = columnsWithPile.filter(
            (column) => !isMonitoringUserNodesColumn(column.name),
        );
        if (isViewerUser) {
            return filteredColumns;
        }
        return filteredColumns.filter((column) => !isViewerUserNodesColumn(column.name));
    }, [columnsWithPile, isUserAllowedToMakeChanges, isViewerUser]);

    const effectiveGroupByParams = React.useMemo(() => {
        if (!bridgeModeEnabled || !groupByParams) {
            return groupByParams;
        }
        return groupByParams.includes('PileName')
            ? groupByParams
            : ([...groupByParams, 'PileName'] as NodesGroupByField[]);
    }, [bridgeModeEnabled, groupByParams]);

    return (
        <PaginatedNodes
            path={path}
            databaseFullPath={databaseFullPath}
            database={database}
            scrollContainerRef={scrollContainerRef}
            withPeerRoleFilter={withPeerRoleFilter}
            columns={preparedColumns}
            defaultColumnsIds={effectiveDefaultColumns}
            requiredColumnsIds={requiredColumnsIds}
            selectedColumnsKey={selectedColumnsKey}
            groupByParams={effectiveGroupByParams}
            onDataFetched={handleDataFetched}
        />
    );
}
