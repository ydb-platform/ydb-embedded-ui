import React from 'react';

import {Illustration} from '../../components/Illustration';
import type {RenderControls} from '../../components/PaginatedTable';
import {ResizeablePaginatedTable} from '../../components/PaginatedTable';
import {NODES_COLUMNS_WIDTH_LS_KEY} from '../../components/nodesColumns/constants';
import type {NodesFilters, NodesPreparedEntity} from '../../store/reducers/nodes/types';
import type {ProblemFilterValue} from '../../store/reducers/settings/types';
import type {NodesGroupByField, NodesPeerRole} from '../../types/api/nodes';
import {NodesUptimeFilterValues} from '../../utils/nodes';
import type {Column} from '../../utils/tableUtils/types';

import {getNodes} from './getNodes';
import i18n from './i18n';
import {getRowClassName, renderPaginatedTableErrorMessage} from './shared';

interface NodesTableProps {
    path?: string;
    database?: string;

    searchValue: string;
    problemFilter: ProblemFilterValue;
    uptimeFilter: NodesUptimeFilterValues;
    peerRoleFilter?: NodesPeerRole;

    filterGroup?: string;
    filterGroupBy?: NodesGroupByField;

    columns: Column<NodesPreparedEntity>[];
    parentRef: React.RefObject<HTMLElement>;

    renderControls?: RenderControls;
    initialEntitiesCount?: number;
}

export function NodesTable({
    path,
    database,
    searchValue,
    problemFilter,
    uptimeFilter,
    peerRoleFilter,
    filterGroup,
    filterGroupBy,
    columns,
    parentRef,
    renderControls,
    initialEntitiesCount,
}: NodesTableProps) {
    const tableFilters: NodesFilters = React.useMemo(() => {
        return {
            path,
            database,
            searchValue,
            problemFilter,
            uptimeFilter,
            peerRoleFilter,
            filterGroup,
            filterGroupBy,
        };
    }, [
        path,
        database,
        searchValue,
        problemFilter,
        uptimeFilter,
        peerRoleFilter,
        filterGroup,
        filterGroupBy,
    ]);

    const renderEmptyDataMessage = () => {
        if (problemFilter !== 'All' || uptimeFilter !== NodesUptimeFilterValues.All) {
            return <Illustration name="thumbsUp" width="200" />;
        }

        return i18n('empty.default');
    };

    return (
        <ResizeablePaginatedTable
            columnsWidthLSKey={NODES_COLUMNS_WIDTH_LS_KEY}
            parentRef={parentRef}
            columns={columns}
            fetchData={getNodes}
            limit={50}
            initialEntitiesCount={initialEntitiesCount}
            renderControls={renderControls}
            renderErrorMessage={renderPaginatedTableErrorMessage}
            renderEmptyDataMessage={renderEmptyDataMessage}
            getRowClassName={getRowClassName}
            filters={tableFilters}
            tableName="nodes"
        />
    );
}
