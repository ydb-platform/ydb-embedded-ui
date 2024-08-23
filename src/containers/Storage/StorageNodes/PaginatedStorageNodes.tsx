import React from 'react';

import type {RenderControls, RenderErrorMessage} from '../../../components/PaginatedTable';
import {ResizeablePaginatedTable} from '../../../components/PaginatedTable';
import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';
import type {VisibleEntities} from '../../../store/reducers/storage/types';
import type {AdditionalNodesProps} from '../../../types/additionalProps';
import {NodesUptimeFilterValues} from '../../../utils/nodes';

import {StorageNodesEmptyDataMessage} from './StorageNodesEmptyDataMessage';
import {getStorageNodes} from './getNodes';
import {
    STORAGE_NODES_COLUMNS_WIDTH_LS_KEY,
    getPreparedStorageNodesColumns,
} from './getStorageNodesColumns';
import i18n from './i18n';
import {getRowUnavailableClassName} from './shared';

interface PaginatedStorageNodesProps {
    searchValue: string;
    visibleEntities: VisibleEntities;
    nodesUptimeFilter: NodesUptimeFilterValues;
    database?: string;

    additionalNodesProps?: AdditionalNodesProps;
    onShowAll: VoidFunction;

    parentContainer?: Element | null;
    renderControls: RenderControls;
    renderErrorMessage: RenderErrorMessage;
}

export const PaginatedStorageNodes = ({
    searchValue,
    visibleEntities,
    nodesUptimeFilter,
    database,
    additionalNodesProps,
    onShowAll,
    parentContainer,
    renderControls,
    renderErrorMessage,
}: PaginatedStorageNodesProps) => {
    const tableFilters = React.useMemo(() => {
        return {searchValue, visibleEntities, nodesUptimeFilter, database};
    }, [searchValue, visibleEntities, nodesUptimeFilter, database]);

    const columns = React.useMemo(() => {
        return getPreparedStorageNodesColumns(additionalNodesProps, visibleEntities, database);
    }, [additionalNodesProps, visibleEntities, database]);

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
            parentContainer={parentContainer}
            columns={columns}
            fetchData={getStorageNodes}
            rowHeight={50}
            limit={50}
            renderControls={renderControls}
            renderErrorMessage={renderErrorMessage}
            renderEmptyDataMessage={renderEmptyDataMessage}
            getRowClassName={getRowUnavailableClassName}
            filters={tableFilters}
            tableName="storage-nodes"
        />
    );
};
