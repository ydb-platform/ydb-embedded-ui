import React from 'react';

import type {
    FetchData,
    RenderControls,
    RenderErrorMessage,
} from '../../../components/PaginatedTable';
import {ResizeablePaginatedTable} from '../../../components/PaginatedTable';
import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';
import type {PreparedStorageGroup, VisibleEntities} from '../../../store/reducers/storage/types';
import type {NodesMap} from '../../../types/store/nodesList';
import type {StorageSortValue} from '../../../utils/storage';

import {StorageGroupsEmptyDataMessage} from './StorageGroupsEmptyDataMessage';
import {getStorageGroups} from './getGroups';
import {
    STORAGE_GROUPS_COLUMNS_WIDTH_LS_KEY,
    getPreparedStorageGroupsColumns,
} from './getStorageGroupsColumns';
import i18n from './i18n';

interface PaginatedStorageGroupsProps {
    searchValue: string;
    visibleEntities: VisibleEntities;
    tenant?: string;
    nodeId?: string;
    nodesMap?: NodesMap;

    onShowAll: VoidFunction;

    parentContainer?: Element | null;
    renderControls: RenderControls;
    renderErrorMessage: RenderErrorMessage;
}

export const PaginatedStorageGroups = ({
    searchValue,
    visibleEntities,
    tenant,
    nodeId,
    nodesMap,
    onShowAll,
    parentContainer,
    renderControls,
    renderErrorMessage,
}: PaginatedStorageGroupsProps) => {
    const filters = React.useMemo(() => {
        return [searchValue, visibleEntities, tenant, nodeId];
    }, [searchValue, visibleEntities, tenant, nodeId]);

    const fetchData = React.useCallback<FetchData<PreparedStorageGroup>>(
        async (limit, offset, {sortOrder, columnId} = {}) => {
            return await getStorageGroups({
                limit,
                offset,
                filter: searchValue,
                visibleEntities,
                tenant,
                nodeId,

                sortOrder,
                sortValue: columnId as StorageSortValue,
            });
        },
        [nodeId, searchValue, tenant, visibleEntities],
    );

    const columns = React.useMemo(() => {
        return getPreparedStorageGroupsColumns(nodesMap, visibleEntities);
    }, [nodesMap, visibleEntities]);

    const renderEmptyDataMessage = () => {
        if (visibleEntities !== VISIBLE_ENTITIES.all) {
            return (
                <StorageGroupsEmptyDataMessage
                    onShowAll={onShowAll}
                    visibleEntities={visibleEntities}
                />
            );
        }

        return i18n('empty.default');
    };

    return (
        <ResizeablePaginatedTable
            columnsWidthLSKey={STORAGE_GROUPS_COLUMNS_WIDTH_LS_KEY}
            parentContainer={parentContainer}
            columns={columns}
            fetchData={fetchData}
            limit={50}
            renderControls={renderControls}
            renderErrorMessage={renderErrorMessage}
            renderEmptyDataMessage={renderEmptyDataMessage}
            dependencyArray={filters}
        />
    );
};
