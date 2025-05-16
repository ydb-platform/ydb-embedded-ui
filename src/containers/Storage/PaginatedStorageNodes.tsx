import React from 'react';

import {ResponseError} from '../../components/Errors/ResponseError';
import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import {
    PaginatedTableProvider,
    usePaginatedTableState,
} from '../../components/PaginatedTable/PaginatedTableContext';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {
    useCapabilitiesLoaded,
    useViewerNodesHandlerHasGrouping,
} from '../../store/reducers/capabilities/hooks';
import {storageApi} from '../../store/reducers/storage/storage';
import type {NodesGroupByField} from '../../types/api/nodes';
import {useAutoRefreshInterval} from '../../utils/hooks';
import {useAdditionalNodesProps} from '../../utils/hooks/useAdditionalNodesProps';
import {NodesUptimeFilterValues} from '../../utils/nodes';
import {renderPaginatedTableErrorMessage} from '../../utils/renderPaginatedTableErrorMessage';

import type {PaginatedStorageProps} from './PaginatedStorage';
import {StorageNodesControls} from './StorageControls/StorageControls';
import {PaginatedStorageNodesTable} from './StorageNodes/PaginatedStorageNodesTable';
import {useStorageNodesSelectedColumns} from './StorageNodes/columns/hooks';
import type {StorageNodesColumnsSettings} from './StorageNodes/columns/types';
import {TableGroup} from './TableGroup/TableGroup';
import {useExpandedGroups} from './TableGroup/useExpandedTableGroups';
import i18n from './i18n';
import {b} from './shared';
import type {StorageViewContext} from './types';
import {useStorageQueryParams} from './useStorageQueryParams';
import {useStorageColumnsSettings} from './utils';

import './Storage.scss';

// Wrapper component to connect StorageNodesControls with the PaginatedTable state
function StorageNodesControlsWithTableState({
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
        <StorageNodesControls
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

export function PaginatedStorageNodes(props: PaginatedStorageProps) {
    const {storageNodesGroupByParam, visibleEntities, nodesUptimeFilter, handleShowAllNodes} =
        useStorageQueryParams();

    const capabilitiesLoaded = useCapabilitiesLoaded();
    const viewerNodesHandlerHasGrouping = useViewerNodesHandlerHasGrouping();

    // Other filters do not fit with grouping
    // Reset them if grouping available
    React.useEffect(() => {
        if (
            viewerNodesHandlerHasGrouping &&
            (visibleEntities !== 'all' || nodesUptimeFilter !== NodesUptimeFilterValues.All)
        ) {
            handleShowAllNodes();
        }
    }, [handleShowAllNodes, nodesUptimeFilter, viewerNodesHandlerHasGrouping, visibleEntities]);

    const renderContent = () => {
        if (viewerNodesHandlerHasGrouping && storageNodesGroupByParam) {
            return <GroupedStorageNodesComponent {...props} />;
        }

        return <StorageNodesComponent {...props} />;
    };

    return <LoaderWrapper loading={!capabilitiesLoaded}>{renderContent()}</LoaderWrapper>;
}

interface StorageNodeGroupProps {
    name: string;
    count: number;
    isExpanded: boolean;
    database?: string;
    nodeId?: string | number;
    groupId?: string | number;
    searchValue: string;
    visibleEntities: 'all';
    filterGroupBy?: NodesGroupByField;
    columns: any[];
    tableContainerRef: React.RefObject<HTMLDivElement>;
    scrollContainerRef: React.RefObject<HTMLElement>;
    onIsExpandedChange: (name: string, isExpanded: boolean) => void;
    handleShowAllNodes: VoidFunction;
    onDataFetched: (data: any) => void;
}

const StorageNodeGroup = React.memo(function StorageNodeGroup({
    name,
    count,
    isExpanded,
    database,
    nodeId,
    groupId,
    searchValue,
    scrollContainerRef,
    filterGroupBy,
    columns,
    tableContainerRef,
    onIsExpandedChange,
    handleShowAllNodes,
    onDataFetched,
}: StorageNodeGroupProps) {
    return (
        <TableGroup
            key={name}
            title={name}
            count={count}
            entityName={i18n('nodes')}
            expanded={isExpanded}
            onIsExpandedChange={onIsExpandedChange}
        >
            <PaginatedStorageNodesTable
                database={database}
                scrollContainerRef={scrollContainerRef}
                tableContainerRef={tableContainerRef}
                nodeId={nodeId}
                groupId={groupId}
                filterGroup={name}
                filterGroupBy={filterGroupBy}
                searchValue={searchValue}
                visibleEntities={'all'}
                nodesUptimeFilter={NodesUptimeFilterValues.All}
                onShowAll={handleShowAllNodes}
                renderErrorMessage={renderPaginatedTableErrorMessage}
                columns={columns}
                initialEntitiesCount={count}
                onDataFetched={onDataFetched}
            />
        </TableGroup>
    );
});

function StorageNodesComponent({
    database,
    nodeId,
    groupId,
    viewContext,
    scrollContainerRef,
    initialEntitiesCount,
}: PaginatedStorageProps) {
    const {searchValue, visibleEntities, nodesUptimeFilter, handleShowAllNodes} =
        useStorageQueryParams();
    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    const viewerNodesHandlerHasGrouping = useViewerNodesHandlerHasGrouping();

    const {handleDataFetched, columnsSettings} = useStorageColumnsSettings();

    const {columnsToShow, columnsToSelect, setColumns} = useStorageNodesColumnsToSelect({
        database,
        viewContext,
        columnsSettings,
    });

    return (
        <PaginatedTableProvider>
            <TableWithControlsLayout>
                <TableWithControlsLayout.Controls>
                    <StorageNodesControlsWithTableState
                        withTypeSelector
                        withGroupBySelect={viewerNodesHandlerHasGrouping}
                        columnsToSelect={columnsToSelect}
                        handleSelectedColumnsUpdate={setColumns}
                    />
                </TableWithControlsLayout.Controls>
                <TableWithControlsLayout.Table ref={tableContainerRef}>
                    <PaginatedStorageNodesTable
                        tableContainerRef={tableContainerRef}
                        database={database}
                        nodeId={nodeId}
                        groupId={groupId}
                        searchValue={searchValue}
                        visibleEntities={visibleEntities}
                        nodesUptimeFilter={nodesUptimeFilter}
                        onShowAll={handleShowAllNodes}
                        scrollContainerRef={scrollContainerRef}
                        renderErrorMessage={renderPaginatedTableErrorMessage}
                        columns={columnsToShow}
                        initialEntitiesCount={initialEntitiesCount}
                        onDataFetched={handleDataFetched}
                    />
                </TableWithControlsLayout.Table>
            </TableWithControlsLayout>
        </PaginatedTableProvider>
    );
}

function GroupedStorageNodesComponent({
    database,
    groupId,
    nodeId,
    viewContext,
    scrollContainerRef,
}: PaginatedStorageProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    const {searchValue, storageNodesGroupByParam, handleShowAllNodes} = useStorageQueryParams();

    const {handleDataFetched, columnsSettings} = useStorageColumnsSettings();
    const {columnsToShow, columnsToSelect, setColumns} = useStorageNodesColumnsToSelect({
        database,
        viewContext,
        columnsSettings,
    });

    const {currentData, isFetching, error} = storageApi.useGetStorageNodesInfoQuery(
        {
            database,
            with: 'all',
            filter: searchValue,
            node_id: nodeId,
            group_id: groupId,
            group: storageNodesGroupByParam,
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
                    <StorageNodeGroup
                        key={name}
                        name={name}
                        count={count}
                        isExpanded={isExpanded}
                        database={database}
                        nodeId={nodeId}
                        groupId={groupId}
                        searchValue={searchValue}
                        visibleEntities="all"
                        filterGroupBy={storageNodesGroupByParam}
                        scrollContainerRef={scrollContainerRef}
                        onIsExpandedChange={setIsGroupExpanded}
                        handleShowAllNodes={handleShowAllNodes}
                        columns={columnsToShow}
                        tableContainerRef={tableContainerRef}
                        onDataFetched={handleDataFetched}
                    />
                );
            });
        }

        return i18n('no-nodes');
    };

    return (
        <PaginatedTableProvider initialState={initialState}>
            <TableWithControlsLayout>
                <TableWithControlsLayout.Controls>
                    <StorageNodesControlsWithTableState
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

function useStorageNodesColumnsToSelect({
    database,
    viewContext,
    columnsSettings,
}: {
    database?: string;
    viewContext?: StorageViewContext;
    columnsSettings?: StorageNodesColumnsSettings;
}) {
    const additionalNodesProps = useAdditionalNodesProps();
    const {visibleEntities} = useStorageQueryParams();

    return useStorageNodesSelectedColumns({
        additionalNodesProps,
        visibleEntities,
        database,
        viewContext,
        columnsSettings,
    });
}
