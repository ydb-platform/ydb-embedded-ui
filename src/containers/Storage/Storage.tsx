import React from 'react';

import type {OrderType, SortOrder} from '@gravity-ui/react-data-table';

import {AccessDenied} from '../../components/Errors/403';
import {isAccessError} from '../../components/Errors/PageError/PageError';
import {ResponseError} from '../../components/Errors/ResponseError';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {
    useCapabilitiesLoaded,
    useStorageGroupsHandlerAvailable,
} from '../../store/reducers/capabilities/hooks';
import {useClusterBaseInfo} from '../../store/reducers/cluster/cluster';
import type {NodesSortParams} from '../../store/reducers/nodes/types';
import {filterGroups, filterNodes} from '../../store/reducers/storage/selectors';
import {storageApi} from '../../store/reducers/storage/storage';
import type {StorageSortParams} from '../../store/reducers/storage/types';
import type {HandleSort} from '../../utils/hooks';
import {useAutoRefreshInterval, useTableSort} from '../../utils/hooks';
import {useAdditionalNodeProps} from '../AppWithClusters/useClusterData';

import {StorageGroupsControls, StorageNodesControls} from './StorageControls/StorageControls';
import {StorageGroupsTable} from './StorageGroups/StorageGroupsTable';
import {useStorageGroupsSelectedColumns} from './StorageGroups/columns/hooks';
import {StorageNodesTable} from './StorageNodes/StorageNodesTable';
import {useStorageNodesSelectedColumns} from './StorageNodes/columns/hooks';
import {b} from './shared';
import type {StorageViewContext} from './types';
import {useStorageQueryParams} from './useStorageQueryParams';
import {defaultSortNode, getDefaultSortGroup} from './utils';

import './Storage.scss';

export function useStorageSort<
    T extends {
        sortValue: string;
        sortOrder: OrderType;
    },
>(
    {sortValue, sortOrder}: T,
    onSort: (params: T | undefined) => void,
): [SortOrder[] | undefined, HandleSort] {
    return useTableSort({
        initialSortColumn: sortValue,
        initialSortOrder: sortOrder,
        multiple: false,
        onSort: (sort) => {
            const newSort = sort?.[0]
                ? {
                      sortValue: sort[0].columnId,
                      sortOrder: sort[0].order,
                  }
                : undefined;

            onSort(newSort as T);
        },
    });
}

interface StorageProps {
    database?: string;
    nodeId?: string | number;
    groupId?: string | number;
    pDiskId?: string | number;

    viewContext: StorageViewContext;
}

export const Storage = ({database, viewContext, nodeId, groupId, pDiskId}: StorageProps) => {
    const {balancer} = useClusterBaseInfo();
    const {additionalNodesProps} = useAdditionalNodeProps({balancer});

    const {
        storageType,
        searchValue,
        visibleEntities,
        nodesUptimeFilter,

        handleShowAllGroups,
        handleShowAllNodes,
    } = useStorageQueryParams();

    const capabilitiesLoaded = useCapabilitiesLoaded();
    const groupsHandlerAvailable = useStorageGroupsHandlerAvailable();
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const isGroups = storageType === 'groups';
    const isNodes = storageType === 'nodes';

    const [nodeSort, setNodeSort] = React.useState<NodesSortParams | undefined>(undefined);
    const nodesSortParams = nodeSort ? nodeSort : defaultSortNode;

    const [groupSort, setGroupSort] = React.useState<StorageSortParams | undefined>(undefined);
    const groupsSortParams = groupSort ? groupSort : getDefaultSortGroup(visibleEntities);

    const {
        columnsToShow: storageNodesColumnsToShow,
        columnsToSelect: storageNodesColumnsToSelect,
        setColumns: setStorageNodesSelectedColumns,
    } = useStorageNodesSelectedColumns({
        additionalNodesProps,
        visibleEntities,
        database,
        viewContext,
    });

    const {
        columnsToShow: storageGroupsColumnsToShow,
        columnsToSelect: storageGroupsColumnsToSelect,
        setColumns: setStorageGroupsSelectedColumns,
    } = useStorageGroupsSelectedColumns({visibleEntities, viewContext});

    const nodesQuery = storageApi.useGetStorageNodesInfoQuery(
        {
            database,
            with: visibleEntities,
            node_id: nodeId,
            group_id: groupId,
        },
        {
            skip: !isNodes,
            pollingInterval: autoRefreshInterval,
        },
    );
    const groupsQuery = storageApi.useGetStorageGroupsInfoQuery(
        {
            database,
            with: visibleEntities,
            nodeId,
            groupId,
            pDiskId,
            shouldUseGroupsHandler: groupsHandlerAvailable,
            fieldsRequired: 'all',
        },
        {
            skip: !isGroups || !capabilitiesLoaded,
            pollingInterval: autoRefreshInterval,
        },
    );

    const {currentData, isFetching, error} = isNodes ? nodesQuery : groupsQuery;

    const {currentData: {nodes = []} = {}} = nodesQuery;
    const {currentData: {groups = []} = {}} = groupsQuery;

    const nodesTotalCount = nodesQuery.currentData?.total || 0;
    const groupsTotalCount = groupsQuery.currentData?.total || 0;

    const isLoading = currentData === undefined && isFetching;

    const storageNodes = React.useMemo(
        () => filterNodes(nodes, searchValue, nodesUptimeFilter),
        [nodes, nodesUptimeFilter, searchValue],
    );
    const storageGroups = React.useMemo(
        () => filterGroups(groups, searchValue),
        [searchValue, groups],
    );

    const [nodesSort, handleNodesSort] = useStorageSort(nodesSortParams, setNodeSort);
    const [groupsSort, handleGroupsSort] = useStorageSort(groupsSortParams, setGroupSort);

    const renderDataTable = () => {
        return (
            <React.Fragment>
                {isGroups ? (
                    <StorageGroupsTable
                        key="groups"
                        visibleEntities={visibleEntities}
                        data={storageGroups}
                        onShowAll={handleShowAllGroups}
                        sort={groupsSort}
                        handleSort={handleGroupsSort}
                        columns={storageGroupsColumnsToShow}
                    />
                ) : null}
                {isNodes ? (
                    <StorageNodesTable
                        key="nodes"
                        visibleEntities={visibleEntities}
                        nodesUptimeFilter={nodesUptimeFilter}
                        data={storageNodes}
                        onShowAll={handleShowAllNodes}
                        sort={nodesSort}
                        handleSort={handleNodesSort}
                        columns={storageNodesColumnsToShow}
                    />
                ) : null}
            </React.Fragment>
        );
    };

    const renderControls = () => {
        return (
            <React.Fragment>
                {isGroups ? (
                    <StorageGroupsControls
                        withTypeSelector
                        entitiesCountCurrent={storageGroups.length}
                        entitiesCountTotal={groupsTotalCount}
                        entitiesLoading={isLoading}
                        columnsToSelect={storageGroupsColumnsToSelect}
                        handleSelectedColumnsUpdate={setStorageGroupsSelectedColumns}
                    />
                ) : null}
                {isNodes ? (
                    <StorageNodesControls
                        withTypeSelector
                        entitiesCountCurrent={storageNodes.length}
                        entitiesCountTotal={nodesTotalCount}
                        entitiesLoading={isLoading}
                        columnsToSelect={storageNodesColumnsToSelect}
                        handleSelectedColumnsUpdate={setStorageNodesSelectedColumns}
                    />
                ) : null}
            </React.Fragment>
        );
    };

    if (isAccessError(error)) {
        return <AccessDenied position="left" />;
    }

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls>{renderControls()}</TableWithControlsLayout.Controls>
            {error ? <ResponseError error={error} /> : null}
            <TableWithControlsLayout.Table
                loading={isLoading || !capabilitiesLoaded}
                className={b('table')}
            >
                {currentData ? renderDataTable() : null}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
};
