import React from 'react';

import type {PaginatedTableData, RenderErrorMessage} from '../../../components/PaginatedTable';
import {ResizeablePaginatedTable} from '../../../components/PaginatedTable';
import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';
import type {PreparedStorageNode, VisibleEntities} from '../../../store/reducers/storage/types';
import type {NodesGroupByField} from '../../../types/api/nodes';
import {cn} from '../../../utils/cn';
import {NodesUptimeFilterValues, isUnavailableNode} from '../../../utils/nodes';

import {StorageNodesEmptyDataMessage} from './StorageNodesEmptyDataMessage';
import {STORAGE_NODES_COLUMNS_WIDTH_LS_KEY} from './columns/constants';
import type {StorageNodesColumn} from './columns/types';
import {getStorageNodes} from './getNodes';
import i18n from './i18n';

import './StorageNodes.scss';

const b = cn('ydb-storage-nodes');

const getRowUnavailableClassName = (row: PreparedStorageNode) =>
    b('node', {unavailable: isUnavailableNode(row)});

interface PaginatedStorageNodesTableProps {
    columns: StorageNodesColumn[];

    database?: string;
    nodeId?: string | number;
    groupId?: string | number;

    filterGroup?: string;
    filterGroupBy?: NodesGroupByField;

    searchValue: string;
    visibleEntities: VisibleEntities;
    nodesUptimeFilter: NodesUptimeFilterValues;
    onShowAll: VoidFunction;

    scrollContainerRef: React.RefObject<HTMLElement>;
    renderErrorMessage: RenderErrorMessage;
    initialEntitiesCount?: number;
    onDataFetched?: (data: PaginatedTableData<PreparedStorageNode>) => void;
}

export const PaginatedStorageNodesTable = ({
    columns,
    database,
    nodeId,
    groupId,
    filterGroup,
    filterGroupBy,
    searchValue,
    visibleEntities,
    nodesUptimeFilter,
    onShowAll,
    scrollContainerRef,
    renderErrorMessage,
    initialEntitiesCount,
    onDataFetched,
}: PaginatedStorageNodesTableProps) => {
    const tableFilters = React.useMemo(() => {
        return {
            searchValue,
            visibleEntities,
            nodesUptimeFilter,
            database,
            nodeId,
            groupId,
            filterGroup,
            filterGroupBy,
        };
    }, [
        searchValue,
        visibleEntities,
        nodesUptimeFilter,
        database,
        nodeId,
        groupId,
        filterGroup,
        filterGroupBy,
    ]);

    const renderEmptyDataMessage = () => {
        if (
            visibleEntities !== VISIBLE_ENTITIES.all ||
            nodesUptimeFilter !== NodesUptimeFilterValues.All
        ) {
            return (
                <StorageNodesEmptyDataMessage
                    onShowAll={onShowAll}
                    nodesUptimeFilter={nodesUptimeFilter}
                    visibleEntities={visibleEntities}
                />
            );
        }

        return i18n('empty.default');
    };

    return (
        <ResizeablePaginatedTable
            columnsWidthLSKey={STORAGE_NODES_COLUMNS_WIDTH_LS_KEY}
            scrollContainerRef={scrollContainerRef}
            columns={columns}
            fetchData={getStorageNodes}
            rowHeight={51}
            initialEntitiesCount={initialEntitiesCount}
            renderErrorMessage={renderErrorMessage}
            renderEmptyDataMessage={renderEmptyDataMessage}
            getRowClassName={getRowUnavailableClassName}
            filters={tableFilters}
            tableName="storage-nodes"
            onDataFetched={onDataFetched}
        />
    );
};
