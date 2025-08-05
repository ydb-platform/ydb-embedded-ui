import React from 'react';

import type {Column} from '../../components/PaginatedTable';
import {
    isMonitoringUserNodesColumn,
    isViewerUserNodesColumn,
} from '../../components/nodesColumns/constants';
import type {NodesColumnId} from '../../components/nodesColumns/constants';
import type {NodesPreparedEntity} from '../../store/reducers/nodes/types';
import type {AdditionalNodesProps} from '../../types/additionalProps';
import type {NodesGroupByField} from '../../types/api/nodes';
import {
    useIsUserAllowedToMakeChanges,
    useIsViewerUser,
} from '../../utils/hooks/useIsUserAllowedToMakeChanges';

import {PaginatedNodes} from './PaginatedNodes';
import {getNodesColumns} from './columns/columns';
import {
    ALL_NODES_GROUP_BY_PARAMS,
    DEFAULT_NODES_COLUMNS,
    NODES_TABLE_SELECTED_COLUMNS_LS_KEY,
    REQUIRED_NODES_COLUMNS,
} from './columns/constants';

import './Nodes.scss';

export interface NodesProps {
    path?: string;
    database?: string;
    scrollContainerRef: React.RefObject<HTMLElement>;
    additionalNodesProps?: AdditionalNodesProps;
    withPeerRoleFilter?: boolean;
    columns?: Column<NodesPreparedEntity>[];
    defaultColumnsIds?: NodesColumnId[];
    requiredColumnsIds?: NodesColumnId[];
    selectedColumnsKey?: string;
    groupByParams?: NodesGroupByField[];
}

export function Nodes({
    path,
    database,
    scrollContainerRef,
    additionalNodesProps,
    withPeerRoleFilter,
    columns = getNodesColumns({database, getNodeRef: additionalNodesProps?.getNodeRef}),
    defaultColumnsIds = DEFAULT_NODES_COLUMNS,
    requiredColumnsIds = REQUIRED_NODES_COLUMNS,
    selectedColumnsKey = NODES_TABLE_SELECTED_COLUMNS_LS_KEY,
    groupByParams = ALL_NODES_GROUP_BY_PARAMS,
}: NodesProps) {
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();
    const isViewerUser = useIsViewerUser();

    const preparedColumns = React.useMemo(() => {
        if (isUserAllowedToMakeChanges) {
            return columns;
        }
        const filteredColumns = columns.filter(
            (column) => !isMonitoringUserNodesColumn(column.name),
        );
        if (isViewerUser) {
            return filteredColumns;
        }
        return filteredColumns.filter((column) => !isViewerUserNodesColumn(column.name));
    }, [columns, isUserAllowedToMakeChanges, isViewerUser]);

    return (
        <PaginatedNodes
            path={path}
            database={database}
            scrollContainerRef={scrollContainerRef}
            withPeerRoleFilter={withPeerRoleFilter}
            columns={preparedColumns}
            defaultColumnsIds={defaultColumnsIds}
            requiredColumnsIds={requiredColumnsIds}
            selectedColumnsKey={selectedColumnsKey}
            groupByParams={groupByParams}
        />
    );
}
