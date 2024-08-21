import React from 'react';

import type {RenderControls, RenderErrorMessage} from '../../../components/PaginatedTable';
import {ResizeablePaginatedTable} from '../../../components/PaginatedTable';
import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';
import type {VisibleEntities} from '../../../store/reducers/storage/types';
import type {NodesMap} from '../../../types/store/nodesList';

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
    database?: string;
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
    database,
    nodeId,
    nodesMap,
    onShowAll,
    parentContainer,
    renderControls,
    renderErrorMessage,
}: PaginatedStorageGroupsProps) => {
    const tableFilters = React.useMemo(() => {
        return {searchValue, visibleEntities, database, nodeId};
    }, [searchValue, visibleEntities, database, nodeId]);

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
            fetchData={getStorageGroups}
            limit={50}
            renderControls={renderControls}
            renderErrorMessage={renderErrorMessage}
            renderEmptyDataMessage={renderEmptyDataMessage}
            filters={tableFilters}
            tableName="storage-groups"
        />
    );
};
