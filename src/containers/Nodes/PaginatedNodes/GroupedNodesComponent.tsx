import React from 'react';

import {isNil} from 'lodash';

import {ResponseError} from '../../../components/Errors/ResponseError';
import type {PaginatedTableData} from '../../../components/PaginatedTable';
import {PaginatedTableWithLayout} from '../../../components/PaginatedTable/PaginatedTableWithLayout';
import {TableColumnSetup} from '../../../components/TableColumnSetup/TableColumnSetup';
import {NODES_COLUMNS_TITLES} from '../../../components/nodesColumns/constants';
import type {NodesColumnId} from '../../../components/nodesColumns/constants';
import type {NodesColumn} from '../../../components/nodesColumns/types';
import {nodesApi} from '../../../store/reducers/nodes/nodes';
import type {PreparedStorageNode} from '../../../store/reducers/storage/types';
import type {NodesGroupByField, NodesPeerRole} from '../../../types/api/nodes';
import {useAutoRefreshInterval} from '../../../utils/hooks';
import {useSelectedColumns} from '../../../utils/hooks/useSelectedColumns';
import {NodesUptimeFilterValues} from '../../../utils/nodes';
import {TableGroup} from '../../Storage/TableGroup/TableGroup';
import {useExpandedGroups} from '../../Storage/TableGroup/useExpandedTableGroups';
import {NodesControls} from '../NodesControls/NodesControls';
import {NodesTable} from '../NodesTable';
import i18n from '../i18n';
import {b} from '../shared';
import {useNodesPageQueryParams} from '../useNodesPageQueryParams';

interface NodeGroupProps {
    name: string;
    count: number;
    isExpanded: boolean;
    path?: string;
    databaseFullPath?: string;
    database?: string;
    searchValue: string;
    peerRoleFilter?: NodesPeerRole;
    groupByParam?: NodesGroupByField;
    columns: NodesColumn[];
    scrollContainerRef: React.RefObject<HTMLElement>;
    onIsExpandedChange: (name: string, isExpanded: boolean) => void;
    onDataFetched?: (data: PaginatedTableData<PreparedStorageNode>) => void;
}

const NodeGroup = React.memo(function NodeGroup({
    name,
    count,
    isExpanded,
    path,
    database,
    databaseFullPath,
    searchValue,
    peerRoleFilter,
    groupByParam,
    columns,
    scrollContainerRef,
    onIsExpandedChange,
    onDataFetched,
}: NodeGroupProps) {
    return (
        <TableGroup
            key={name}
            title={name}
            count={count}
            entityName={i18n('nodes')}
            expanded={isExpanded}
            onIsExpandedChange={onIsExpandedChange}
        >
            <PaginatedTableWithLayout
                initialState={{sortParams: undefined}}
                table={
                    <NodesTable
                        path={path}
                        databaseFullPath={databaseFullPath}
                        database={database}
                        searchValue={searchValue}
                        withProblems={false}
                        uptimeFilter={NodesUptimeFilterValues.All}
                        peerRoleFilter={peerRoleFilter}
                        filterGroup={name}
                        filterGroupBy={groupByParam}
                        initialEntitiesCount={count}
                        columns={columns}
                        scrollContainerRef={scrollContainerRef}
                        onDataFetched={onDataFetched}
                    />
                }
                tableWrapperProps={{
                    scrollContainerRef: scrollContainerRef,
                }}
            />
        </TableGroup>
    );
});

interface GroupedNodesComponentProps {
    path?: string;
    database?: string;
    databaseFullPath?: string;
    scrollContainerRef: React.RefObject<HTMLElement>;
    withPeerRoleFilter?: boolean;
    columns: NodesColumn[];
    defaultColumnsIds: NodesColumnId[];
    requiredColumnsIds: NodesColumnId[];
    selectedColumnsKey: string;
    groupByParams: NodesGroupByField[];
    onDataFetched?: (data: PaginatedTableData<PreparedStorageNode>) => void;
    nodeId?: string;
}

export function GroupedNodesComponent({
    path,
    databaseFullPath,
    database,
    scrollContainerRef,
    withPeerRoleFilter,
    columns,
    defaultColumnsIds,
    requiredColumnsIds,
    selectedColumnsKey,
    groupByParams,
    onDataFetched,
    nodeId,
}: GroupedNodesComponentProps) {
    const {searchValue, peerRoleFilter, groupByParam} = useNodesPageQueryParams(
        groupByParams,
        withPeerRoleFilter,
    );
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {columnsToShow, columnsToSelect, setColumns} = useSelectedColumns(
        columns,
        selectedColumnsKey,
        NODES_COLUMNS_TITLES,
        defaultColumnsIds,
        requiredColumnsIds,
    );

    const schemaPathParam = React.useMemo(() => {
        if (!isNil(path) && !isNil(databaseFullPath)) {
            return {path, databaseFullPath};
        }
        return undefined;
    }, [path, databaseFullPath]);

    const {currentData, isFetching, error} = nodesApi.useGetNodesQuery(
        {
            path: schemaPathParam,
            database,
            filter: searchValue,
            filter_peer_role: peerRoleFilter,
            group: groupByParam,
            node_id: nodeId,
            limit: 0,
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
                    <NodeGroup
                        key={name}
                        name={name}
                        count={count}
                        isExpanded={isExpanded}
                        path={path}
                        databaseFullPath={databaseFullPath}
                        database={database}
                        searchValue={searchValue}
                        peerRoleFilter={peerRoleFilter}
                        groupByParam={groupByParam}
                        columns={columnsToShow}
                        scrollContainerRef={scrollContainerRef}
                        onIsExpandedChange={setIsGroupExpanded}
                        onDataFetched={onDataFetched}
                    />
                );
            });
        }

        return i18n('no-nodes-groups');
    };

    return (
        <PaginatedTableWithLayout
            initialState={initialState}
            controls={
                <NodesControls
                    groupByParams={groupByParams}
                    withPeerRoleFilter={withPeerRoleFilter}
                    entitiesCountCurrent={found}
                    entitiesCountTotal={total}
                    entitiesLoading={isLoading}
                    withGroupBySelect
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
            tableWrapperProps={{
                scrollContainerRef,
                scrollDependencies: [searchValue, groupByParam, tableGroups, peerRoleFilter],
                loading: isLoading,
                className: b('groups-wrapper'),
            }}
        />
    );
}
