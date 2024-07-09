import React from 'react';

import type {
    FetchData,
    RenderControls,
    RenderErrorMessage,
} from '../../../components/PaginatedTable';
import {ResizeablePaginatedTable} from '../../../components/PaginatedTable';
import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';
import type {PreparedStorageNode, VisibleEntities} from '../../../store/reducers/storage/types';
import type {AdditionalNodesProps} from '../../../types/additionalProps';
import {NodesUptimeFilterValues, getUptimeParamValue} from '../../../utils/nodes';
import type {NodesSortValue} from '../../../utils/nodes';

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
    tenant?: string;

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
    tenant,
    additionalNodesProps,
    onShowAll,
    parentContainer,
    renderControls,
    renderErrorMessage,
}: PaginatedStorageNodesProps) => {
    const filters = React.useMemo(() => {
        return [searchValue, visibleEntities, nodesUptimeFilter, tenant];
    }, [searchValue, visibleEntities, nodesUptimeFilter, tenant]);

    const fetchData = React.useCallback<FetchData<PreparedStorageNode>>(
        async (limit, offset, {sortOrder, columnId} = {}) => {
            return await getStorageNodes({
                limit,
                offset,
                filter: searchValue,
                uptime: getUptimeParamValue(nodesUptimeFilter),
                visibleEntities,
                tenant,

                sortOrder,
                sortValue: columnId as NodesSortValue,
            });
        },
        [nodesUptimeFilter, searchValue, tenant, visibleEntities],
    );

    const columns = React.useMemo(() => {
        return getPreparedStorageNodesColumns(additionalNodesProps, visibleEntities);
    }, [additionalNodesProps, visibleEntities]);

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
            fetchData={fetchData}
            rowHeight={50}
            limit={50}
            renderControls={renderControls}
            renderErrorMessage={renderErrorMessage}
            renderEmptyDataMessage={renderEmptyDataMessage}
            getRowClassName={getRowUnavailableClassName}
            dependencyArray={filters}
        />
    );
};
