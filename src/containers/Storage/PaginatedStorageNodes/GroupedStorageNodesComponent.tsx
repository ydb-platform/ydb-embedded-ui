import React from 'react';

import {ResponseError} from '../../../components/Errors/ResponseError';
import {PaginatedTableWithLayout} from '../../../components/PaginatedTable/PaginatedTableWithLayout';
import {TableColumnSetup} from '../../../components/TableColumnSetup/TableColumnSetup';
import {storageApi} from '../../../store/reducers/storage/storage';
import type {NodesGroupByField} from '../../../types/api/nodes';
import {getCapacityAlertColor} from '../../../utils/capacityAlert/colors';
import {useAutoRefreshInterval} from '../../../utils/hooks';
import {NodesUptimeFilterValues} from '../../../utils/nodes';
import {renderPaginatedTableErrorMessage} from '../../../utils/renderPaginatedTableErrorMessage';
import type {PaginatedStorageProps} from '../PaginatedStorage';
import {PaginatedStorageNodesTable} from '../PaginatedStorageNodesTable/PaginatedStorageNodesTable';
import {TableGroup} from '../TableGroup/TableGroup';
import {useExpandedGroups} from '../TableGroup/useExpandedTableGroups';
import i18n from '../i18n';
import {b} from '../shared';
import {useStorageQueryParams} from '../useStorageQueryParams';
import {useStorageColumnsSettings} from '../utils';

import {StorageNodesControls} from './StorageNodesControls';
import {useStorageNodesColumnsToSelect} from './useStorageNodesColumnsToSelect';

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
    onDataFetched: (data: any) => void;
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
}: StorageNodeGroupProps) {
    const titleColor = filterGroupBy === 'CapacityAlert' ? getCapacityAlertColor(name) : undefined;

    return (
        <TableGroup
            key={name}
            title={name}
            count={count}
            entityName={i18n('nodes')}
            expanded={isExpanded}
            onIsExpandedChange={onIsExpandedChange}
            titleColor={titleColor}
        >
            <PaginatedTableWithLayout
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

export function GroupedStorageNodesComponent({
    database,
    groupId,
    nodeId,
    viewContext,
    scrollContainerRef,
}: PaginatedStorageProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {nodesSearchValue, storageNodesGroupByParam, handleShowAllNodes} =
        useStorageQueryParams();

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
            filter: nodesSearchValue,
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
                        searchValue={nodesSearchValue}
                        visibleEntities="all"
                        filterGroupBy={storageNodesGroupByParam}
                        scrollContainerRef={scrollContainerRef}
                        onIsExpandedChange={setIsGroupExpanded}
                        handleShowAllNodes={handleShowAllNodes}
                        columns={columnsToShow}
                        onDataFetched={handleDataFetched}
                    />
                );
            });
        }

        return i18n('no-nodes');
    };

    return (
        <PaginatedTableWithLayout
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
