import React from 'react';

import type {Column} from '../../../components/PaginatedTable';
import {PaginatedTableWithLayout} from '../../../components/PaginatedTable/PaginatedTableWithLayout';
import {NODES_COLUMNS_TITLES} from '../../../components/nodesColumns/constants';
import type {NodesColumnId} from '../../../components/nodesColumns/constants';
import {useViewerNodesHandlerHasGrouping} from '../../../store/reducers/capabilities/hooks';
import type {NodesPreparedEntity} from '../../../store/reducers/nodes/types';
import {useProblemFilter} from '../../../store/reducers/settings/hooks';
import type {NodesGroupByField} from '../../../types/api/nodes';
import {useSelectedColumns} from '../../../utils/hooks/useSelectedColumns';
import {NodesTable} from '../NodesTable';
import {useNodesPageQueryParams} from '../useNodesPageQueryParams';

import {NodesControlsWithTableState} from './NodesControlsWithTableState';

interface NodesComponentProps {
    path?: string;
    database?: string;
    scrollContainerRef: React.RefObject<HTMLElement>;
    withPeerRoleFilter?: boolean;
    columns: Column<NodesPreparedEntity>[];
    defaultColumnsIds: NodesColumnId[];
    requiredColumnsIds: NodesColumnId[];
    selectedColumnsKey: string;
    groupByParams: NodesGroupByField[];
}

export function NodesComponent({
    path,
    database,
    scrollContainerRef,
    withPeerRoleFilter,
    columns,
    defaultColumnsIds,
    requiredColumnsIds,
    selectedColumnsKey,
    groupByParams,
}: NodesComponentProps) {
    const {searchValue, uptimeFilter, peerRoleFilter} = useNodesPageQueryParams(groupByParams);
    const {problemFilter} = useProblemFilter();
    const viewerNodesHandlerHasGrouping = useViewerNodesHandlerHasGrouping();

    const {columnsToShow, columnsToSelect, setColumns} = useSelectedColumns(
        columns,
        selectedColumnsKey,
        NODES_COLUMNS_TITLES,
        defaultColumnsIds,
        requiredColumnsIds,
    );

    return (
        <PaginatedTableWithLayout
            controls={
                <NodesControlsWithTableState
                    withGroupBySelect={viewerNodesHandlerHasGrouping}
                    groupByParams={groupByParams}
                    withPeerRoleFilter={withPeerRoleFilter}
                    columnsToSelect={columnsToSelect}
                    handleSelectedColumnsUpdate={setColumns}
                />
            }
            table={
                <NodesTable
                    path={path}
                    database={database}
                    searchValue={searchValue}
                    problemFilter={problemFilter}
                    uptimeFilter={uptimeFilter}
                    peerRoleFilter={peerRoleFilter}
                    columns={columnsToShow}
                    scrollContainerRef={scrollContainerRef}
                />
            }
            tableProps={{
                scrollContainerRef,
                scrollDependencies: [searchValue, problemFilter, uptimeFilter, peerRoleFilter],
            }}
            fullHeight
        />
    );
}
