import React from 'react';

import {ResponseError} from '../../../components/Errors/ResponseError/ResponseError';
import {PaginatedTableWithLayout} from '../../../components/PaginatedTable/PaginatedTableWithLayout';
import {TableColumnSetup} from '../../../components/TableColumnSetup/TableColumnSetup';
import {storageApi} from '../../../store/reducers/storage/storage';
import type {GroupsGroupByField} from '../../../types/api/storage';
import {useAutoRefreshInterval} from '../../../utils/hooks';
import {renderPaginatedTableErrorMessage} from '../../../utils/renderPaginatedTableErrorMessage';
import type {PaginatedStorageProps} from '../PaginatedStorage';
import {PaginatedStorageGroupsTable} from '../PaginatedStorageGroupsTable';
import {useStorageGroupsSelectedColumns} from '../PaginatedStorageGroupsTable/columns/hooks';
import type {StorageGroupsColumn} from '../PaginatedStorageGroupsTable/columns/types';
import {TableGroup} from '../TableGroup/TableGroup';
import {useExpandedGroups} from '../TableGroup/useExpandedTableGroups';
import i18n from '../i18n';
import {b} from '../shared';
import {useStorageQueryParams} from '../useStorageQueryParams';

import {StorageGroupsControls} from './StorageGroupsControls';

interface StorageGroupGroupProps {
    name: string;
    count: number;
    isExpanded: boolean;
    database?: string;
    nodeId?: string | number;
    groupId?: string | number;
    pDiskId?: string | number;
    searchValue: string;
    visibleEntities: 'all';
    filterGroupBy?: GroupsGroupByField;
    columns: StorageGroupsColumn[];
    scrollContainerRef: React.RefObject<HTMLElement>;
    onIsExpandedChange: (name: string, isExpanded: boolean) => void;
    handleShowAllGroups: VoidFunction;
}

export const StorageGroupGroup = React.memo(function StorageGroupGroup({
    name,
    count,
    isExpanded,
    database,
    nodeId,
    groupId,
    pDiskId,
    searchValue,
    scrollContainerRef,
    filterGroupBy,
    columns,
    onIsExpandedChange,
    handleShowAllGroups,
}: StorageGroupGroupProps) {
    return (
        <TableGroup
            key={name}
            title={name}
            count={count}
            entityName={i18n('groups')}
            expanded={isExpanded}
            onIsExpandedChange={onIsExpandedChange}
        >
            <PaginatedTableWithLayout
                initialState={{sortParams: undefined}}
                table={
                    <PaginatedStorageGroupsTable
                        database={database}
                        scrollContainerRef={scrollContainerRef}
                        nodeId={nodeId}
                        groupId={groupId}
                        pDiskId={pDiskId}
                        filterGroup={name}
                        filterGroupBy={filterGroupBy}
                        searchValue={searchValue}
                        visibleEntities={'all'}
                        onShowAll={handleShowAllGroups}
                        renderErrorMessage={renderPaginatedTableErrorMessage}
                        columns={columns}
                        initialEntitiesCount={count}
                    />
                }
                tableWrapperProps={{
                    scrollContainerRef: scrollContainerRef,
                }}
            />
        </TableGroup>
    );
});

export function GroupedStorageGroupsComponent({
    database,
    nodeId,
    groupId,
    pDiskId,
    scrollContainerRef,
    viewContext,
}: PaginatedStorageProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {searchValue, storageGroupsGroupByParam, visibleEntities, handleShowAllGroups} =
        useStorageQueryParams();

    const {columnsToShow, columnsToSelect, setColumns} = useStorageGroupsSelectedColumns({
        visibleEntities,
        viewContext,
    });

    const {currentData, isFetching, error} = storageApi.useGetStorageGroupsInfoQuery(
        {
            database,
            with: 'all',
            nodeId,
            groupId,
            pDiskId,
            filter: searchValue,
            shouldUseGroupsHandler: true,
            group: storageGroupsGroupByParam,
        },
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    const isLoading = currentData === undefined && isFetching;
    const {tableGroups, found = 0, total = 0} = currentData || {};

    const {expandedGroups, setIsGroupExpanded} = useExpandedGroups(tableGroups);

    // Initialize the table state with the API data
    const initialState = React.useMemo(
        () => ({
            foundEntities: found,
            totalEntities: total,
            isInitialLoad: isLoading,
            sortParams: undefined,
        }),
        [found, total, isLoading],
    );

    const renderGroups = () => {
        if (tableGroups?.length) {
            return tableGroups.map(({name, count}) => {
                const isExpanded = expandedGroups[name];

                return (
                    <StorageGroupGroup
                        key={name}
                        name={name}
                        count={count}
                        isExpanded={isExpanded}
                        database={database}
                        nodeId={nodeId}
                        groupId={groupId}
                        pDiskId={pDiskId}
                        filterGroupBy={storageGroupsGroupByParam}
                        searchValue={searchValue}
                        visibleEntities={'all'}
                        scrollContainerRef={scrollContainerRef}
                        onIsExpandedChange={setIsGroupExpanded}
                        handleShowAllGroups={handleShowAllGroups}
                        columns={columnsToShow}
                    />
                );
            });
        }

        return i18n('no-groups');
    };

    return (
        <PaginatedTableWithLayout
            controls={
                <StorageGroupsControls
                    withTypeSelector
                    withGroupBySelect
                    entitiesCountCurrent={found}
                    entitiesCountTotal={total}
                    entitiesLoading={isLoading}
                />
            }
            extraControls={
                <TableColumnSetup
                    popupWidth={200}
                    items={columnsToSelect}
                    showStatus
                    onUpdate={setColumns}
                />
            }
            error={error ? <ResponseError error={error} /> : null}
            table={renderGroups()}
            initialState={initialState}
            tableWrapperProps={{
                scrollContainerRef,
                scrollDependencies: [searchValue, storageGroupsGroupByParam, tableGroups],
                loading: isLoading,
                className: b('groups-wrapper'),
            }}
        />
    );
}
