import React from 'react';

import {
    DataIssuesAlert,
    getEmptyDataWithIssuesMessage,
} from '../../../components/DataIssuesAlert/DataIssuesAlert';
import {ResponseError} from '../../../components/Errors/ResponseError';
import {PaginatedTableWithLayout} from '../../../components/PaginatedTable/PaginatedTableWithLayout';
import {TableColumnSetup} from '../../../components/TableColumnSetup/TableColumnSetup';
import {NODES_COLUMNS_TO_DATA_FIELDS} from '../../../components/nodesColumns/constants';
import {storageApi} from '../../../store/reducers/storage/storage';
import type {NodesGroupByField, NodesRequiredField} from '../../../types/api/nodes';
import {getNodesDataIssues} from '../../../utils/dataIssues/classify';
import {getResponseDataQuality, mergeDataQuality} from '../../../utils/dataIssues/dataQuality';
import type {TableDataWithQuality} from '../../../utils/dataIssues/types';
import {useTableDataQuality} from '../../../utils/dataIssues/useTableDataQuality';
import {useAutoRefreshInterval} from '../../../utils/hooks';
import {useHideUnavailableNodes} from '../../../utils/hooks/useHideUnavailableNodes';
import {NodesUptimeFilterValues} from '../../../utils/nodes';
import {renderPaginatedTableErrorMessage} from '../../../utils/renderPaginatedTableErrorMessage';
import {getRequiredDataFields} from '../../../utils/tableUtils/getRequiredDataFields';
import type {PaginatedStorageProps} from '../PaginatedStorage';
import {PaginatedStorageNodesTable} from '../PaginatedStorageNodesTable/PaginatedStorageNodesTable';
import {TableGroup} from '../TableGroup/TableGroup';
import {useExpandedGroups} from '../TableGroup/useExpandedTableGroups';
import i18n from '../i18n';
import {b} from '../shared';
import type {StorageNodesPaginatedTableData} from '../types';
import {useIsStorageExpertMode, useStorageQueryParams} from '../useStorageQueryParams';
import {getStorageNodesDataIssuesContext, useStorageColumnsSettings} from '../utils';

import {StorageNodesControls} from './StorageNodesControls';
import {useStorageNodesColumnsToSelect} from './useStorageNodesColumnsToSelect';

const NODE_SEARCH_FIELDS_REQUIRED = new Set<NodesRequiredField>(['Host', 'NodeName']);

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
    scrollContainerRef: React.RefObject<HTMLElement>;
    onIsExpandedChange: (name: string, isExpanded: boolean) => void;
    handleShowAllNodes: VoidFunction;
    onDataFetched: (data: StorageNodesPaginatedTableData) => void;
    onChunkDataChange: (
        chunkOffset: number,
        data: TableDataWithQuality<unknown> | undefined,
        source: string,
    ) => void;
    rowHeight: number;
    hasDataIssues: boolean;
}

export const StorageNodeGroup = React.memo(function StorageNodeGroup({
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
    onIsExpandedChange,
    handleShowAllNodes,
    onDataFetched,
    onChunkDataChange,
    rowHeight,
    hasDataIssues,
}: StorageNodeGroupProps) {
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
                    <PaginatedStorageNodesTable
                        database={database}
                        scrollContainerRef={scrollContainerRef}
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
                        rowHeight={rowHeight}
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

export function GroupedStorageNodesComponent({
    database,
    groupId,
    nodeId,
    viewContext,
    scrollContainerRef,
}: PaginatedStorageProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {hideUnavailable} = useHideUnavailableNodes();

    const {nodesSearchValue, storageNodesGroupByParam, handleShowAllNodes} =
        useStorageQueryParams();

    const expertMode = useIsStorageExpertMode();
    const {handleDataFetched, columnsSettings, rowHeight} = useStorageColumnsSettings({
        expertMode,
    });
    const {columnsToShow, columnsToSelect, setColumns} = useStorageNodesColumnsToSelect({
        database,
        viewContext,
        columnsSettings,
    });

    const searchFieldsRequired = React.useMemo(() => {
        const activeFieldsRequired = getRequiredDataFields(
            columnsToShow.map(({name}) => name),
            NODES_COLUMNS_TO_DATA_FIELDS,
        );

        return activeFieldsRequired.filter((field) => NODE_SEARCH_FIELDS_REQUIRED.has(field));
    }, [columnsToShow]);

    const {currentData, isFetching, error} = storageApi.useGetStorageNodesInfoQuery(
        {
            database,
            alive: hideUnavailable || undefined,
            with: 'all',
            filter: nodesSearchValue.trim(),
            node_id: nodeId,
            group_id: groupId,
            group: storageNodesGroupByParam,
            fieldsRequired: nodesSearchValue.trim() ? searchFieldsRequired : undefined,
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
        // Without grouping the handler returns a plain list of nodes
        if (groupingQuality && !tableGroups?.length && currentData?.nodes?.length) {
            groupingQuality.needGroup = true;
        }

        // A collapsed group renders no table, so only the expanded groups report their chunks
        return mergeDataQuality([groupingQuality, ...Object.values(dataQualityBySource)]);
    }, [currentData, tableGroups, dataQualityBySource]);
    const dataIssues = React.useMemo(
        () =>
            getNodesDataIssues(dataQuality, getStorageNodesDataIssuesContext({database, groupId})),
        [dataQuality, database, groupId],
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
                    <StorageNodeGroup
                        key={name}
                        name={name}
                        count={count}
                        isExpanded={isExpanded}
                        database={database}
                        nodeId={nodeId}
                        groupId={groupId}
                        searchValue={nodesSearchValue}
                        visibleEntities="all"
                        filterGroupBy={storageNodesGroupByParam}
                        scrollContainerRef={scrollContainerRef}
                        onIsExpandedChange={setIsGroupExpanded}
                        handleShowAllNodes={handleShowAllNodes}
                        columns={columnsToShow}
                        rowHeight={rowHeight}
                        onDataFetched={handleDataFetched}
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

        return hasDataIssues ? getEmptyDataWithIssuesMessage() : i18n('no-nodes');
    };

    return (
        <PaginatedTableWithLayout
            notice={
                hasDataIssues ? (
                    <DataIssuesAlert issues={dataIssues} problems={dataQuality?.problems} />
                ) : null
            }
            controls={
                <StorageNodesControls
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
                scrollDependencies: [nodesSearchValue, storageNodesGroupByParam, tableGroups],
                loading: isLoading,
                className: b('groups-wrapper'),
            }}
        />
    );
}
