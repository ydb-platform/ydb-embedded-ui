import React from 'react';

import {ResponseError} from '../../components/Errors/ResponseError';
import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import type {Column, RenderControls} from '../../components/PaginatedTable';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {NODES_COLUMNS_TITLES} from '../../components/nodesColumns/constants';
import type {NodesColumnId} from '../../components/nodesColumns/constants';
import {
    useCapabilitiesLoaded,
    useViewerNodesHandlerHasGrouping,
} from '../../store/reducers/capabilities/hooks';
import {nodesApi} from '../../store/reducers/nodes/nodes';
import type {NodesPreparedEntity} from '../../store/reducers/nodes/types';
import {useProblemFilter} from '../../store/reducers/settings/hooks';
import type {AdditionalNodesProps} from '../../types/additionalProps';
import type {NodesGroupByField} from '../../types/api/nodes';
import {useAutoRefreshInterval} from '../../utils/hooks';
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
                    columns={columns}
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
                columns={columns}
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

    const {columnsToShow, columnsToSelect, setColumns} = useSelectedColumns(
        columns,
        selectedColumnsKey,
        NODES_COLUMNS_TITLES,
        defaultColumnsIds,
        requiredColumnsIds,
    );

    const renderControls: RenderControls = ({totalEntities, foundEntities, inited}) => {
        return (
            <NodesControls
                withGroupBySelect={viewerNodesHandlerHasGrouping}
                groupByParams={groupByParams}
                withPeerRoleFilter={withPeerRoleFilter}
                columnsToSelect={columnsToSelect}
                handleSelectedColumnsUpdate={setColumns}
                entitiesCountCurrent={foundEntities}
                entitiesCountTotal={totalEntities}
                entitiesLoading={!inited}
            />
        );
    };

    return (
        <NodesTable
            path={path}
            database={database}
            searchValue={searchValue}
            problemFilter={problemFilter}
            uptimeFilter={uptimeFilter}
            peerRoleFilter={peerRoleFilter}
            columns={columnsToShow}
            parentRef={parentRef}
            renderControls={renderControls}
        />
    );
}

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

    const renderControls = () => {
        return (
            <NodesControls
                withGroupBySelect
                groupByParams={groupByParams}
                withPeerRoleFilter={withPeerRoleFilter}
                columnsToSelect={columnsToSelect}
                handleSelectedColumnsUpdate={setColumns}
                entitiesCountCurrent={found}
                entitiesCountTotal={total}
                entitiesLoading={isLoading}
            />
        );
    };

    const renderGroups = () => {
        if (tableGroups?.length) {
            return tableGroups.map(({name, count}) => {
                const isExpanded = expandedGroups[name];

                return (
                    <TableGroup
                        key={name}
                        title={name}
                        count={count}
                        entityName={i18n('nodes')}
                        expanded={isExpanded}
                        onIsExpandedChange={setIsGroupExpanded}
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
                            columns={columnsToShow}
                            parentRef={parentRef}
                        />
                    </TableGroup>
                );
            });
        }

        return i18n('no-nodes-groups');
    };

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls>{renderControls()}</TableWithControlsLayout.Controls>
            {error ? <ResponseError error={error} /> : null}
            <TableWithControlsLayout.Table loading={isLoading} className={b('groups-wrapper')}>
                {renderGroups()}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
}
