import React from 'react';

import type {TableColumnSetupItem} from '@gravity-ui/uikit';

import {ResponseError} from '../../components/Errors/ResponseError';
import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import type {Column} from '../../components/PaginatedTable';
import {
    PaginatedTableProvider,
    usePaginatedTableState,
} from '../../components/PaginatedTable/PaginatedTableContext';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {
    NODES_COLUMNS_TITLES,
    isMonitoringUserNodesColumn,
} from '../../components/nodesColumns/constants';
import type {NodesColumnId} from '../../components/nodesColumns/constants';
import {
    useCapabilitiesLoaded,
    useViewerNodesHandlerHasGrouping,
} from '../../store/reducers/capabilities/hooks';
import {nodesApi} from '../../store/reducers/nodes/nodes';
import type {NodesPreparedEntity} from '../../store/reducers/nodes/types';
import {useProblemFilter} from '../../store/reducers/settings/hooks';
import type {AdditionalNodesProps} from '../../types/additionalProps';
import type {NodesGroupByField, NodesPeerRole} from '../../types/api/nodes';
import {useAutoRefreshInterval} from '../../utils/hooks';
import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {useSelectedColumns} from '../../utils/hooks/useSelectedColumns';
import {NodesUptimeFilterValues} from '../../utils/nodes';
import {TableGroup} from '../Storage/TableGroup/TableGroup';
import {useExpandedGroups} from '../Storage/TableGroup/useExpandedTableGroups';

import {NodesControls} from './NodesControls/NodesControls';
import {NodesTable} from './NodesTable';
import {getNodesColumns} from './columns/columns';
import {
    ALL_NODES_GROUP_BY_PARAMS,
    DEFAULT_NODES_COLUMNS,
    NODES_TABLE_SELECTED_COLUMNS_LS_KEY,
    REQUIRED_NODES_COLUMNS,
} from './columns/constants';
import i18n from './i18n';
import {b} from './shared';
import {useNodesPageQueryParams} from './useNodesPageQueryParams';

import './Nodes.scss';

export interface NodesProps {
    path?: string;
    database?: string;
    parentRef: React.RefObject<HTMLElement>;
    additionalNodesProps?: AdditionalNodesProps;

    withPeerRoleFilter?: boolean;

    columns?: Column<NodesPreparedEntity>[];
    defaultColumnsIds?: NodesColumnId[];
    requiredColumnsIds?: NodesColumnId[];
    selectedColumnsKey?: string;
    groupByParams?: NodesGroupByField[];
}

export function Nodes({
    path,
    database,
    parentRef,
    additionalNodesProps,
    withPeerRoleFilter,
    columns = getNodesColumns({database, getNodeRef: additionalNodesProps?.getNodeRef}),
    defaultColumnsIds = DEFAULT_NODES_COLUMNS,
    requiredColumnsIds = REQUIRED_NODES_COLUMNS,
    selectedColumnsKey = NODES_TABLE_SELECTED_COLUMNS_LS_KEY,
    groupByParams = ALL_NODES_GROUP_BY_PARAMS,
}: NodesProps) {
    const {uptimeFilter, groupByParam, handleUptimeFilterChange} =
        useNodesPageQueryParams(groupByParams);
    const {problemFilter, handleProblemFilterChange} = useProblemFilter();

    const capabilitiesLoaded = useCapabilitiesLoaded();
    const viewerNodesHandlerHasGrouping = useViewerNodesHandlerHasGrouping();
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();

    const preparedColumns = React.useMemo(() => {
        if (isUserAllowedToMakeChanges) {
            return columns;
        }
        return columns.filter((column) => !isMonitoringUserNodesColumn(column.name));
    }, [columns, isUserAllowedToMakeChanges]);

    // Other filters do not fit with grouping
    // Reset them if grouping available
    React.useEffect(() => {
        if (
            viewerNodesHandlerHasGrouping &&
            (problemFilter !== 'All' || uptimeFilter !== NodesUptimeFilterValues.All)
        ) {
            handleProblemFilterChange('All');
            handleUptimeFilterChange(NodesUptimeFilterValues.All);
        }
    }, [
        handleProblemFilterChange,
        handleUptimeFilterChange,
        problemFilter,
        uptimeFilter,
        viewerNodesHandlerHasGrouping,
    ]);

    const renderContent = () => {
        if (viewerNodesHandlerHasGrouping && groupByParam) {
            return (
                <GroupedNodesComponent
                    path={path}
                    database={database}
                    parentRef={parentRef}
                    withPeerRoleFilter={withPeerRoleFilter}
                    columns={preparedColumns}
                    defaultColumnsIds={defaultColumnsIds}
                    requiredColumnsIds={requiredColumnsIds}
                    selectedColumnsKey={selectedColumnsKey}
                    groupByParams={groupByParams}
                />
            );
        }

        return (
            <NodesComponent
                path={path}
                database={database}
                parentRef={parentRef}
                withPeerRoleFilter={withPeerRoleFilter}
                columns={preparedColumns}
                defaultColumnsIds={defaultColumnsIds}
                requiredColumnsIds={requiredColumnsIds}
                selectedColumnsKey={selectedColumnsKey}
                groupByParams={groupByParams}
            />
        );
    };

    return <LoaderWrapper loading={!capabilitiesLoaded}>{renderContent()}</LoaderWrapper>;
}

interface NodesComponentProps {
    path?: string;
    database?: string;
    parentRef: React.RefObject<HTMLElement>;

    withPeerRoleFilter?: boolean;

    columns: Column<NodesPreparedEntity>[];
    defaultColumnsIds: NodesColumnId[];
    requiredColumnsIds: NodesColumnId[];
    selectedColumnsKey: string;
    groupByParams: NodesGroupByField[];
}

function NodesComponent({
    path,
    database,
    parentRef,
    withPeerRoleFilter,
    columns,
    defaultColumnsIds,
    requiredColumnsIds,
    selectedColumnsKey,
    groupByParams,
}: NodesComponentProps) {
    const {searchValue, uptimeFilter, peerRoleFilter} = useNodesPageQueryParams(groupByParams);
    const {problemFilter} = useProblemFilter();
    const viewerNodesHandlerHasGrouping = useViewerNodesHandlerHasGrouping();
    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    const {columnsToShow, columnsToSelect, setColumns} = useSelectedColumns(
        columns,
        selectedColumnsKey,
        NODES_COLUMNS_TITLES,
        defaultColumnsIds,
        requiredColumnsIds,
    );

    return (
        <PaginatedTableProvider>
            <TableWithControlsLayout>
                <TableWithControlsLayout.Controls>
                    <NodesControlsWithTableState
                        withGroupBySelect={viewerNodesHandlerHasGrouping}
                        groupByParams={groupByParams}
                        withPeerRoleFilter={withPeerRoleFilter}
                        columnsToSelect={columnsToSelect}
                        handleSelectedColumnsUpdate={setColumns}
                    />
                </TableWithControlsLayout.Controls>
                <TableWithControlsLayout.Table ref={tableContainerRef}>
                    <NodesTable
                        path={path}
                        database={database}
                        searchValue={searchValue}
                        problemFilter={problemFilter}
                        uptimeFilter={uptimeFilter}
                        peerRoleFilter={peerRoleFilter}
                        columns={columnsToShow}
                        parentRef={parentRef}
                        tableContainerRef={tableContainerRef}
                    />
                </TableWithControlsLayout.Table>
            </TableWithControlsLayout>
        </PaginatedTableProvider>
    );
}

// Wrapper component to connect NodesControls with the PaginatedTable state
function NodesControlsWithTableState({
    withGroupBySelect,
    groupByParams,
    withPeerRoleFilter,
    columnsToSelect,
    handleSelectedColumnsUpdate,
}: {
    withGroupBySelect: boolean;
    groupByParams: NodesGroupByField[];
    withPeerRoleFilter?: boolean;
    columnsToSelect: TableColumnSetupItem[];
    handleSelectedColumnsUpdate: (updated: TableColumnSetupItem[]) => void;
}) {
    const {tableState} = usePaginatedTableState();

    return (
        <NodesControls
            withGroupBySelect={withGroupBySelect}
            groupByParams={groupByParams}
            withPeerRoleFilter={withPeerRoleFilter}
            columnsToSelect={columnsToSelect}
            handleSelectedColumnsUpdate={handleSelectedColumnsUpdate}
            entitiesCountCurrent={tableState.foundEntities}
            entitiesCountTotal={tableState.totalEntities}
            entitiesLoading={tableState.isInitialLoad}
        />
    );
}

interface NodeGroupProps {
    name: string;
    count: number;
    isExpanded: boolean;
    path?: string;
    database?: string;
    searchValue: string;
    peerRoleFilter?: NodesPeerRole;
    groupByParam?: NodesGroupByField;
    columns: Column<NodesPreparedEntity>[];
    parentRef: React.RefObject<HTMLElement>;
    onIsExpandedChange: (name: string, isExpanded: boolean) => void;
}

const NodeGroup = React.memo(function NodeGroup({
    name,
    count,
    isExpanded,
    path,
    database,
    searchValue,
    peerRoleFilter,
    groupByParam,
    columns,
    parentRef,
    onIsExpandedChange,
}: NodeGroupProps) {
    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    return (
        <TableGroup
            key={name}
            title={name}
            count={count}
            entityName={i18n('nodes')}
            expanded={isExpanded}
            onIsExpandedChange={onIsExpandedChange}
            ref={tableContainerRef}
        >
            <NodesTable
                path={path}
                database={database}
                searchValue={searchValue}
                problemFilter={'All'}
                uptimeFilter={NodesUptimeFilterValues.All}
                peerRoleFilter={peerRoleFilter}
                filterGroup={name}
                filterGroupBy={groupByParam}
                initialEntitiesCount={count}
                columns={columns}
                parentRef={parentRef}
                tableContainerRef={tableContainerRef}
            />
        </TableGroup>
    );
});

function GroupedNodesComponent({
    path,
    database,
    parentRef,
    withPeerRoleFilter,
    columns,
    defaultColumnsIds,
    requiredColumnsIds,
    selectedColumnsKey,
    groupByParams,
}: NodesComponentProps) {
    const {searchValue, peerRoleFilter, groupByParam} = useNodesPageQueryParams(groupByParams);
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    const {columnsToShow, columnsToSelect, setColumns} = useSelectedColumns(
        columns,
        selectedColumnsKey,
        NODES_COLUMNS_TITLES,
        defaultColumnsIds,
        requiredColumnsIds,
    );

    const {currentData, isFetching, error} = nodesApi.useGetNodesQuery(
        {
            path,
            database,
            filter: searchValue,
            filter_peer_role: peerRoleFilter,
            group: groupByParam,
            limit: 0,
        },
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    const isLoading = currentData === undefined && isFetching;
    const {
        NodeGroups: tableGroups,
        FoundNodes: found = 0,
        TotalNodes: total = 0,
    } = currentData || {};

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
                    <NodeGroup
                        key={name}
                        name={name}
                        count={count}
                        isExpanded={isExpanded}
                        path={path}
                        database={database}
                        searchValue={searchValue}
                        peerRoleFilter={peerRoleFilter}
                        groupByParam={groupByParam}
                        columns={columnsToShow}
                        parentRef={parentRef}
                        onIsExpandedChange={setIsGroupExpanded}
                    />
                );
            });
        }

        return i18n('no-nodes-groups');
    };

    return (
        <PaginatedTableProvider initialState={initialState}>
            <TableWithControlsLayout>
                <TableWithControlsLayout.Controls>
                    <NodesControlsWithTableState
                        withGroupBySelect={true}
                        groupByParams={groupByParams}
                        withPeerRoleFilter={withPeerRoleFilter}
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
