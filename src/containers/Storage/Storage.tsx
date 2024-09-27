import React from 'react';

import {StringParam, useQueryParams} from 'use-query-params';

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
import {VISIBLE_ENTITIES} from '../../store/reducers/storage/constants';
import {filterGroups, filterNodes} from '../../store/reducers/storage/selectors';
import {storageApi} from '../../store/reducers/storage/storage';
import {storageTypeSchema, visibleEntitiesSchema} from '../../store/reducers/storage/types';
import type {
    StorageSortParams,
    StorageType,
    VisibleEntities,
} from '../../store/reducers/storage/types';
import {valueIsDefined} from '../../utils';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {useAutoRefreshInterval, useTableSort} from '../../utils/hooks';
import {NodesUptimeFilterValues, nodesUptimeFilterValuesSchema} from '../../utils/nodes';
import {useAdditionalNodeProps} from '../AppWithClusters/useClusterData';

import {StorageControls} from './StorageControls/StorageControls';
import {StorageGroups} from './StorageGroups/StorageGroups';
import {useStorageGroupsSelectedColumns} from './StorageGroups/columns/hooks';
import {StorageNodes} from './StorageNodes/StorageNodes';
import {useStorageNodesSelectedColumns} from './StorageNodes/columns/hooks';
import {b} from './shared';
import {defaultSortNode, getDefaultSortGroup} from './utils';

import './Storage.scss';

interface StorageProps {
    database?: string;
    nodeId?: string | number;
    groupId?: string | number;
    pDiskId?: string | number;
}

export const Storage = ({database, nodeId, groupId, pDiskId}: StorageProps) => {
    const {balancer} = useClusterBaseInfo();
    const {additionalNodesProps} = useAdditionalNodeProps({balancer});

    const capabilitiesLoaded = useCapabilitiesLoaded();
    const groupsHandlerAvailable = useStorageGroupsHandlerAvailable();
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const [queryParams, setQueryParams] = useQueryParams({
        type: StringParam,
        visible: StringParam,
        search: StringParam,
        uptimeFilter: StringParam,
    });
    const storageType = storageTypeSchema.parse(queryParams.type);
    const isGroups = storageType === 'groups';
    const isNodes = storageType === 'nodes';

    const visibleEntities = visibleEntitiesSchema.parse(queryParams.visible);
    const filter = queryParams.search ?? '';
    const uptimeFilter = nodesUptimeFilterValuesSchema.parse(queryParams.uptimeFilter);

    const [nodeSort, setNodeSort] = React.useState<NodesSortParams>({
        sortOrder: undefined,
        sortValue: undefined,
    });
    const nodesSortParams = nodeSort.sortValue ? nodeSort : defaultSortNode;

    const [groupSort, setGroupSort] = React.useState<StorageSortParams>({
        sortOrder: undefined,
        sortValue: undefined,
    });
    const groupsSortParams = groupSort.sortOrder ? groupSort : getDefaultSortGroup(visibleEntities);

    const {
        columnsToShow: storageNodesColumnsToShow,
        columnsToSelect: storageNodesColumnsToSelect,
        setColumns: setStorageNodesSelectedColumns,
    } = useStorageNodesSelectedColumns({
        additionalNodesProps,
        visibleEntities,
        database,
        groupId: groupId?.toString(),
    });

    const {
        columnsToShow: storageGroupsColumnsToShow,
        columnsToSelect: storageGroupsColumnsToSelect,
        setColumns: setStorageGroupsSelectedColumns,
    } = useStorageGroupsSelectedColumns(visibleEntities);

    const nodesQuery = storageApi.useGetStorageNodesInfoQuery(
        {
            database,
            with: visibleEntities,
            node_id: nodeId,
            // node_id and group_id params don't work together
            group_id: valueIsDefined(nodeId) ? undefined : groupId,
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
        },
        {
            skip: !isGroups || !capabilitiesLoaded,
            pollingInterval: autoRefreshInterval,
        },
    );

    const {currentData, isFetching, error} = isNodes ? nodesQuery : groupsQuery;

    const {currentData: {nodes = []} = {}} = nodesQuery;
    const {currentData: {groups = []} = {}} = groupsQuery;
    const {nodes: _, groups: __, ...entitiesCount} = currentData ?? {found: 0, total: 0};

    const isLoading = currentData === undefined && isFetching;

    const storageNodes = React.useMemo(
        () => filterNodes(nodes, filter, uptimeFilter),
        [filter, nodes, uptimeFilter],
    );
    const storageGroups = React.useMemo(() => filterGroups(groups, filter), [filter, groups]);

    const [nodesSort, handleNodesSort] = useTableSort(nodesSortParams, (params) =>
        setNodeSort(params as NodesSortParams),
    );
    const [groupsSort, handleGroupsSort] = useTableSort(groupsSortParams, (params) =>
        setGroupSort(params as StorageSortParams),
    );

    const handleTextFilterChange = (value: string) => {
        setQueryParams({search: value || undefined}, 'replaceIn');
    };

    const handleGroupVisibilityChange = (value: VisibleEntities) => {
        setQueryParams({visible: value}, 'replaceIn');
    };

    const handleStorageTypeChange = (value: StorageType) => {
        setQueryParams({type: value}, 'replaceIn');
    };

    const handleUptimeFilterChange = (value: NodesUptimeFilterValues) => {
        setQueryParams({uptimeFilter: value}, 'replaceIn');
    };

    const handleShowAllNodes = () => {
        handleGroupVisibilityChange(VISIBLE_ENTITIES.all);
        handleUptimeFilterChange(NodesUptimeFilterValues.All);
    };

    const renderDataTable = () => {
        return (
            <React.Fragment>
                {isGroups ? (
                    <StorageGroups
                        key="groups"
                        visibleEntities={visibleEntities}
                        data={storageGroups}
                        tableSettings={DEFAULT_TABLE_SETTINGS}
                        onShowAll={() => handleGroupVisibilityChange(VISIBLE_ENTITIES.all)}
                        sort={groupsSort}
                        handleSort={handleGroupsSort}
                        columns={storageGroupsColumnsToShow}
                    />
                ) : null}
                {isNodes ? (
                    <StorageNodes
                        key="nodes"
                        visibleEntities={visibleEntities}
                        nodesUptimeFilter={uptimeFilter}
                        data={storageNodes}
                        tableSettings={DEFAULT_TABLE_SETTINGS}
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
        const entitiesCountCurrent = isGroups ? storageGroups.length : storageNodes.length;

        const columnsToSelect = isGroups
            ? storageGroupsColumnsToSelect
            : storageNodesColumnsToSelect;

        const handleSelectedColumnsUpdate = isGroups
            ? setStorageGroupsSelectedColumns
            : setStorageNodesSelectedColumns;

        return (
            <StorageControls
                searchValue={filter}
                handleSearchValueChange={handleTextFilterChange}
                withTypeSelector
                storageType={storageType}
                handleStorageTypeChange={handleStorageTypeChange}
                visibleEntities={visibleEntities}
                handleVisibleEntitiesChange={handleGroupVisibilityChange}
                nodesUptimeFilter={uptimeFilter}
                handleNodesUptimeFilterChange={handleUptimeFilterChange}
                entitiesCountCurrent={entitiesCountCurrent}
                entitiesCountTotal={entitiesCount.total}
                entitiesLoading={isLoading}
                columnsToSelect={columnsToSelect}
                handleSelectedColumnsUpdate={handleSelectedColumnsUpdate}
            />
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
