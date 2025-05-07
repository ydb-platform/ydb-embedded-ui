import React from 'react';

import {ResponseError} from '../../components/Errors/ResponseError/ResponseError';
import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import {
    PaginatedTableProvider,
    usePaginatedTableState,
} from '../../components/PaginatedTable/PaginatedTableContext';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {
    useCapabilitiesLoaded,
    useStorageGroupsHandlerHasGrouping,
} from '../../store/reducers/capabilities/hooks';
import {storageApi} from '../../store/reducers/storage/storage';
import type {GroupsGroupByField} from '../../types/api/storage';
import {useAutoRefreshInterval} from '../../utils/hooks';
import {renderPaginatedTableErrorMessage} from '../../utils/renderPaginatedTableErrorMessage';

import type {PaginatedStorageProps} from './PaginatedStorage';
import {StorageGroupsControls} from './StorageControls/StorageControls';
import {PaginatedStorageGroupsTable} from './StorageGroups/PaginatedStorageGroupsTable';
import {useStorageGroupsSelectedColumns} from './StorageGroups/columns/hooks';
import type {StorageGroupsColumn} from './StorageGroups/columns/types';
import {TableGroup} from './TableGroup/TableGroup';
import {useExpandedGroups} from './TableGroup/useExpandedTableGroups';
import i18n from './i18n';
import {b} from './shared';
import {useStorageQueryParams} from './useStorageQueryParams';

import './Storage.scss';

// Wrapper component to connect StorageGroupsControls with the PaginatedTable state
function StorageGroupsControlsWithTableState({
    withTypeSelector,
    withGroupBySelect,
    columnsToSelect,
    handleSelectedColumnsUpdate,
}: {
    withTypeSelector?: boolean;
    withGroupBySelect?: boolean;
    columnsToSelect: any[];
    handleSelectedColumnsUpdate: (updated: any[]) => void;
}) {
    const {tableState} = usePaginatedTableState();

    return (
        <StorageGroupsControls
            withTypeSelector={withTypeSelector}
            withGroupBySelect={withGroupBySelect}
            entitiesCountCurrent={tableState.foundEntities}
            entitiesCountTotal={tableState.totalEntities}
            entitiesLoading={tableState.isInitialLoad}
            columnsToSelect={columnsToSelect}
            handleSelectedColumnsUpdate={handleSelectedColumnsUpdate}
        />
    );
}

export function PaginatedStorageGroups(props: PaginatedStorageProps) {
    const {storageGroupsGroupByParam, visibleEntities, handleShowAllGroups} =
        useStorageQueryParams();

    const capabilitiesLoaded = useCapabilitiesLoaded();
    const storageGroupsHandlerHasGroupping = useStorageGroupsHandlerHasGrouping();

    // Other filters do not fit with grouping
    // Reset them if grouping available
    React.useEffect(() => {
        if (storageGroupsHandlerHasGroupping && visibleEntities !== 'all') {
            handleShowAllGroups();
        }
    }, [handleShowAllGroups, storageGroupsHandlerHasGroupping, visibleEntities]);

    const renderContent = () => {
        if (storageGroupsHandlerHasGroupping && storageGroupsGroupByParam) {
            return <GroupedStorageGroupsComponent {...props} />;
        }

        return <StorageGroupsComponent {...props} />;
    };

    return <LoaderWrapper loading={!capabilitiesLoaded}>{renderContent()}</LoaderWrapper>;
}

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
    parentRef: React.RefObject<HTMLElement>;
    onIsExpandedChange: (name: string, isExpanded: boolean) => void;
    handleShowAllGroups: VoidFunction;
}

const StorageGroupGroup = React.memo(function StorageGroupGroup({
    name,
    count,
    isExpanded,
    database,
    nodeId,
    groupId,
    pDiskId,
    searchValue,
    parentRef,
    filterGroupBy,
    columns,
    onIsExpandedChange,
    handleShowAllGroups,
}: StorageGroupGroupProps) {
    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    return (
        <TableGroup
            key={name}
            title={name}
            count={count}
            entityName={i18n('groups')}
            expanded={isExpanded}
            onIsExpandedChange={onIsExpandedChange}
            ref={tableContainerRef}
        >
            <PaginatedStorageGroupsTable
                database={database}
                parentRef={parentRef}
                tableContainerRef={tableContainerRef}
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
        </TableGroup>
    );
});

function StorageGroupsComponent({
    database,
    nodeId,
    groupId,
    pDiskId,
    viewContext,
    parentRef,
    initialEntitiesCount,
}: PaginatedStorageProps) {
    const {searchValue, visibleEntities, handleShowAllGroups} = useStorageQueryParams();

    const storageGroupsHandlerHasGroupping = useStorageGroupsHandlerHasGrouping();
    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    const {columnsToShow, columnsToSelect, setColumns} = useStorageGroupsSelectedColumns({
        visibleEntities,
        viewContext,
    });

    return (
        <PaginatedTableProvider>
            <TableWithControlsLayout>
                <TableWithControlsLayout.Controls>
                    <StorageGroupsControlsWithTableState
                        withTypeSelector
                        withGroupBySelect={storageGroupsHandlerHasGroupping}
                        columnsToSelect={columnsToSelect}
                        handleSelectedColumnsUpdate={setColumns}
                    />
                </TableWithControlsLayout.Controls>
                <TableWithControlsLayout.Table ref={tableContainerRef}>
                    <PaginatedStorageGroupsTable
                        database={database}
                        nodeId={nodeId}
                        groupId={groupId}
                        pDiskId={pDiskId}
                        searchValue={searchValue}
                        visibleEntities={visibleEntities}
                        onShowAll={handleShowAllGroups}
                        parentRef={parentRef}
                        tableContainerRef={tableContainerRef}
                        renderErrorMessage={renderPaginatedTableErrorMessage}
                        columns={columnsToShow}
                        initialEntitiesCount={initialEntitiesCount}
                    />
                </TableWithControlsLayout.Table>
            </TableWithControlsLayout>
        </PaginatedTableProvider>
    );
}

function GroupedStorageGroupsComponent({
    database,
    nodeId,
    groupId,
    pDiskId,
    parentRef,
    viewContext,
}: PaginatedStorageProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const tableContainerRef = React.useRef<HTMLDivElement>(null);
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
                        parentRef={parentRef}
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
        <PaginatedTableProvider initialState={initialState}>
            <TableWithControlsLayout>
                <TableWithControlsLayout.Controls>
                    <StorageGroupsControlsWithTableState
                        withTypeSelector
                        withGroupBySelect
                        columnsToSelect={columnsToSelect}
                        handleSelectedColumnsUpdate={setColumns}
                    />
                </TableWithControlsLayout.Controls>
                {error ? <ResponseError error={error} /> : null}
                <TableWithControlsLayout.Table
                    ref={tableContainerRef}
                    loading={isLoading}
                    className={b('groups-wrapper')}
                >
                    {renderGroups()}
                </TableWithControlsLayout.Table>
            </TableWithControlsLayout>
        </PaginatedTableProvider>
    );
}
