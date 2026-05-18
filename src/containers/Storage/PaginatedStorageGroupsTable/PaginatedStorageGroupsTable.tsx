import React from 'react';

import {LoaderWrapper} from '../../../components/LoaderWrapper/LoaderWrapper';
import type {RenderErrorMessage} from '../../../components/PaginatedTable';
import {PAGINATED_TABLE_IDS, ResizeablePaginatedTable} from '../../../components/PaginatedTable';
import {
    useCapabilitiesLoaded,
    useStorageGroupsHandlerAvailable,
} from '../../../store/reducers/capabilities/hooks';
import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';
import type {VisibleEntities} from '../../../store/reducers/storage/types';
import type {GroupsGroupByField} from '../../../types/api/storage';

import {StorageGroupsEmptyDataMessage} from './StorageGroupsEmptyDataMessage';
import {STORAGE_GROUPS_COLUMNS_IDS, STORAGE_GROUPS_COLUMNS_WIDTH_LS_KEY} from './columns/constants';
import type {StorageGroupsColumn} from './columns/types';
import {useGroupsGetter} from './getGroups';
import i18n from './i18n';

import './PaginatedStorageGroupsTable.scss';

const STORAGE_GROUPS_TABLE_ROW_HEIGHT_WITH_VDISKS = 46;

const columnsWithVDisks = new Set<string>([
    STORAGE_GROUPS_COLUMNS_IDS.VDisks,
    STORAGE_GROUPS_COLUMNS_IDS.VDisksPDisks,
]);

interface PaginatedStorageGroupsTableProps {
    columns: StorageGroupsColumn[];

    database?: string;
    nodeId?: string | number;
    groupId?: string | number;
    pDiskId?: string | number;

    filterGroup?: string;
    filterGroupBy?: GroupsGroupByField;

    searchValue: string;
    visibleEntities: VisibleEntities;
    onShowAll: VoidFunction;

    scrollContainerRef: React.RefObject<HTMLElement>;
    renderErrorMessage: RenderErrorMessage;
    initialEntitiesCount?: number;
}

export const PaginatedStorageGroupsTable = ({
    columns,
    database,
    nodeId,
    groupId,
    pDiskId,
    filterGroup,
    filterGroupBy,
    searchValue,
    visibleEntities,
    onShowAll,
    scrollContainerRef,
    renderErrorMessage,
    initialEntitiesCount,
}: PaginatedStorageGroupsTableProps) => {
    const capabilitiesLoaded = useCapabilitiesLoaded();
    const groupsHandlerAvailable = useStorageGroupsHandlerAvailable();

    const fetchData = useGroupsGetter(groupsHandlerAvailable);

    const hasVDisksColumns = React.useMemo(() => {
        return columns.some((column) => columnsWithVDisks.has(column.name));
    }, [columns]);

    const tableContainerClassName = hasVDisksColumns
        ? 'ydb-storage-groups-table_with-vdisks'
        : undefined;

    const tableFilters = React.useMemo(() => {
        return {
            searchValue,
            visibleEntities,
            database,
            nodeId,
            groupId,
            pDiskId,
            filterGroup,
            filterGroupBy,
        };
    }, [
        searchValue,
        visibleEntities,
        database,
        nodeId,
        groupId,
        pDiskId,
        filterGroup,
        filterGroupBy,
    ]);

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
        <LoaderWrapper loading={!capabilitiesLoaded}>
            <ResizeablePaginatedTable
                columnsWidthLSKey={STORAGE_GROUPS_COLUMNS_WIDTH_LS_KEY}
                scrollContainerRef={scrollContainerRef}
                columns={columns}
                rowHeight={
                    hasVDisksColumns ? STORAGE_GROUPS_TABLE_ROW_HEIGHT_WITH_VDISKS : undefined
                }
                containerClassName={tableContainerClassName}
                fetchData={fetchData}
                initialEntitiesCount={initialEntitiesCount}
                renderErrorMessage={renderErrorMessage}
                renderEmptyDataMessage={renderEmptyDataMessage}
                filters={tableFilters}
                tableName={PAGINATED_TABLE_IDS.STORAGE_GROUPS}
            />
        </LoaderWrapper>
    );
};
