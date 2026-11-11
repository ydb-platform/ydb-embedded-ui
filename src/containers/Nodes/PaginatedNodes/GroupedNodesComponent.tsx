import React from 'react';

import {isNil} from 'lodash';

import {
    DataIssuesAlert,
    getEmptyDataWithIssuesMessage,
} from '../../../components/DataIssuesAlert/DataIssuesAlert';
import {ResponseError} from '../../../components/Errors/ResponseError';
import type {PaginatedTableData} from '../../../components/PaginatedTable';
import {PaginatedTableWithLayout} from '../../../components/PaginatedTable/PaginatedTableWithLayout';
import {TableColumnSetup} from '../../../components/TableColumnSetup/TableColumnSetup';
import {
    NODES_COLUMNS_TITLES,
    NODES_COLUMNS_TO_DATA_FIELDS,
} from '../../../components/nodesColumns/constants';
import type {NodesColumnId} from '../../../components/nodesColumns/constants';
import type {NodesColumn} from '../../../components/nodesColumns/types';
import {useClusterWithProxy} from '../../../store/reducers/cluster/cluster';
import {nodesApi} from '../../../store/reducers/nodes/nodes';
import type {PreparedStorageNode} from '../../../store/reducers/storage/types';
import type {NodesGroupByField, NodesPeerRole, NodesRequiredField} from '../../../types/api/nodes';
import {getNodesDataIssues} from '../../../utils/dataIssues/classify';
import {getResponseDataQuality, mergeDataQuality} from '../../../utils/dataIssues/dataQuality';
import type {TableDataWithQuality} from '../../../utils/dataIssues/types';
import {useTableDataQuality} from '../../../utils/dataIssues/useTableDataQuality';
import {useAutoRefreshInterval} from '../../../utils/hooks';
import {useHideUnavailableNodes} from '../../../utils/hooks/useHideUnavailableNodes';
import {useSelectedColumns} from '../../../utils/hooks/useSelectedColumns';
import {NodesUptimeFilterValues} from '../../../utils/nodes';
import {getRequiredDataFields} from '../../../utils/tableUtils/getRequiredDataFields';
import {TableGroup} from '../../Storage/TableGroup/TableGroup';
import {useExpandedGroups} from '../../Storage/TableGroup/useExpandedTableGroups';
import {NodesControls} from '../NodesControls/NodesControls';
import {NodesTable} from '../NodesTable';
import i18n from '../i18n';
import {b} from '../shared';
import {useNodesPageQueryParams} from '../useNodesPageQueryParams';

const NODE_SEARCH_FIELDS_REQUIRED = new Set<NodesRequiredField>(['Host', 'NodeName']);

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
    onChunkDataChange: (
        chunkOffset: number,
        data: TableDataWithQuality<unknown> | undefined,
        source: string,
    ) => void;
    hasDataIssues: boolean;
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
    onChunkDataChange,
    hasDataIssues,
}: NodeGroupProps) {
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
            entityName={i18n('nodes')}
            expanded={isExpanded}
            onIsExpandedChange={onIsExpandedChange}
        >
            <PaginatedTableWithLayout
                inheritKeyboardNavigation
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
}: GroupedNodesComponentProps) {
    const {searchValue, peerRoleFilter, groupByParam} = useNodesPageQueryParams(
        groupByParams,
        withPeerRoleFilter,
    );
    const useMetaProxy = useClusterWithProxy();
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {hideUnavailable} = useHideUnavailableNodes();

    const {columnsToShow, columnsToSelect, setColumns} = useSelectedColumns(
        columns,
        selectedColumnsKey,
        NODES_COLUMNS_TITLES,
        defaultColumnsIds,
        requiredColumnsIds,
    );

    const searchFieldsRequired = React.useMemo(() => {
        const activeFieldsRequired = getRequiredDataFields(
            columnsToShow.map(({name}) => name),
            NODES_COLUMNS_TO_DATA_FIELDS,
        );

        return activeFieldsRequired.filter((field) => NODE_SEARCH_FIELDS_REQUIRED.has(field));
    }, [columnsToShow]);

    const schemaPathParam = React.useMemo(() => {
        if (!isNil(path) && !isNil(databaseFullPath)) {
            return {path, databaseFullPath, useMetaProxy};
        }
        return undefined;
    }, [path, databaseFullPath, useMetaProxy]);

    const {currentData, isFetching, error} = nodesApi.useGetNodesQuery(
        {
            path: schemaPathParam,
            database,
            alive: hideUnavailable || undefined,
            filter: searchValue.trim(),
            filter_peer_role: peerRoleFilter,
            group: groupByParam,
            fieldsRequired: searchValue.trim() ? searchFieldsRequired : undefined,
            limit: 0,
        },
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    const isLoading = currentData === undefined && isFetching;
    const {tableGroups, found = 0, total = 0} = currentData || {};

    const {expandedGroups, setIsGroupExpanded} = useExpandedGroups(tableGroups);

    const {dataQualityBySource, handleChunkDataChange} = useTableDataQuality();
    const dataQuality = React.useMemo(
        () =>
            // A collapsed group renders no table, so only the expanded groups report their chunks
            mergeDataQuality([
                getResponseDataQuality(currentData),
                ...Object.values(dataQualityBySource),
            ]),
        [currentData, dataQualityBySource],
    );
    const dataIssues = React.useMemo(
        () => getNodesDataIssues(dataQuality, {hasDatabase: Boolean(database)}),
        [dataQuality, database],
    );
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
                        onChunkDataChange={handleChunkDataChange}
                        hasDataIssues={hasDataIssues}
                    />
                );
            });
        }

        if (dataIssues.includes('group-not-applied')) {
            // The warning above the table says why there are no groups to show
            return null;
        }

        return hasDataIssues ? getEmptyDataWithIssuesMessage() : i18n('no-nodes-groups');
    };

    return (
        <PaginatedTableWithLayout
            initialState={initialState}
            notice={
                hasDataIssues ? (
                    <DataIssuesAlert issues={dataIssues} problems={dataQuality?.problems} />
                ) : null
            }
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
