import React from 'react';

import {
    DataIssuesAlert,
    getEmptyDataWithIssuesMessage,
} from '../../../components/DataIssuesAlert/DataIssuesAlert';
import {DataIssuesIndicator} from '../../../components/DataIssuesAlert/DataIssuesIndicator';
import {ResponseError} from '../../../components/Errors/ResponseError/ResponseError';
import {PaginatedTableWithLayout} from '../../../components/PaginatedTable/PaginatedTableWithLayout';
import {TableColumnSetup} from '../../../components/TableColumnSetup/TableColumnSetup';
import {storageApi} from '../../../store/reducers/storage/storage';
import type {GroupsGroupByField} from '../../../types/api/storage';
import {getStorageGroupsDataIssues} from '../../../utils/dataIssues/classify';
import {getResponseDataQuality, mergeDataQuality} from '../../../utils/dataIssues/dataQuality';
import type {TableDataWithQuality} from '../../../utils/dataIssues/types';
import {useTableDataQuality} from '../../../utils/dataIssues/useTableDataQuality';
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
    onChunkDataChange: (
        chunkOffset: number,
        data: TableDataWithQuality<unknown> | undefined,
        source: string,
    ) => void;
    hasDataIssues: boolean;
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
    onChunkDataChange,
    hasDataIssues,
}: StorageGroupGroupProps) {
    const handleChunkDataChange = React.useCallback(
        (chunkOffset: number, data: TableDataWithQuality<unknown> | undefined) =>
            onChunkDataChange(chunkOffset, data, name),
        [onChunkDataChange, name],
    );

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
                inheritKeyboardNavigation
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
                        onChunkDataChange={handleChunkDataChange}
                        hasDataIssues={hasDataIssues}
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
    const {groupsSearchValue, storageGroupsGroupByParam, visibleEntities, handleShowAllGroups} =
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
            filter: groupsSearchValue.trim(),
            group: storageGroupsGroupByParam,
        },
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    const isLoading = currentData === undefined && isFetching;
    const {tableGroups, found = 0, total = 0} = currentData || {};

    const {expandedGroups, setIsGroupExpanded} = useExpandedGroups(tableGroups);

    const {dataQualityBySource, handleChunkDataChange} = useTableDataQuality();
    const dataQuality = React.useMemo(() => {
        const groupingQuality = getResponseDataQuality(currentData);
        // Without grouping the handler returns a plain list of storage groups
        if (groupingQuality && !tableGroups?.length && currentData?.groups?.length) {
            groupingQuality.needGroup = true;
        }

        // A collapsed group renders no table, so only the expanded groups report their chunks
        return mergeDataQuality([groupingQuality, ...Object.values(dataQualityBySource)]);
    }, [currentData, tableGroups, dataQualityBySource]);
    const dataIssues = React.useMemo(() => getStorageGroupsDataIssues(dataQuality), [dataQuality]);
    const hasDataIssues = dataIssues.length > 0;

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
                        searchValue={groupsSearchValue}
                        visibleEntities={'all'}
                        scrollContainerRef={scrollContainerRef}
                        onIsExpandedChange={setIsGroupExpanded}
                        handleShowAllGroups={handleShowAllGroups}
                        columns={columnsToShow}
                        onChunkDataChange={handleChunkDataChange}
                        hasDataIssues={hasDataIssues}
                    />
                );
            });
        }

        if (dataIssues.includes('group-not-applied')) {
            // There are no groups to show, so the reason takes their place
            return <DataIssuesAlert issues={dataIssues} problems={dataQuality?.problems} />;
        }

        return hasDataIssues ? getEmptyDataWithIssuesMessage() : i18n('no-groups');
    };

    return (
        <PaginatedTableWithLayout
            controls={
                <StorageGroupsControls
                    withTypeSelector
                    withGroupBySelect
                    columns={columnsToShow}
                    entitiesCountCurrent={found}
                    entitiesCountTotal={total}
                    entitiesLoading={isLoading}
                    dataIssuesIndicator={
                        <DataIssuesIndicator
                            compact
                            issues={dataIssues}
                            problems={dataQuality?.problems}
                        />
                    }
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
                scrollDependencies: [groupsSearchValue, storageGroupsGroupByParam, tableGroups],
                loading: isLoading,
                className: b('groups-wrapper'),
            }}
        />
    );
}
