import React from 'react';

import {ArrayParam, StringParam, useQueryParams, withDefault} from 'use-query-params';

import {AccessDenied} from '../../components/Errors/403';
import {ResponseError} from '../../components/Errors/ResponseError';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import type {NodesSortParams} from '../../store/reducers/nodes/types';
import {selectNodesMap} from '../../store/reducers/nodesList';
import {STORAGE_TYPES, VISIBLE_ENTITIES} from '../../store/reducers/storage/constants';
import {
    filterGroups,
    filterNodes,
    getUsageFilterOptions,
} from '../../store/reducers/storage/selectors';
import {storageApi} from '../../store/reducers/storage/storage';
import {storageTypeSchema, visibleEntitiesSchema} from '../../store/reducers/storage/types';
import type {
    StorageSortParams,
    StorageType,
    VisibleEntities,
} from '../../store/reducers/storage/types';
import type {AdditionalNodesProps} from '../../types/additionalProps';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {useAutoRefreshInterval, useTableSort, useTypedSelector} from '../../utils/hooks';
import {NodesUptimeFilterValues, nodesUptimeFilterValuesSchema} from '../../utils/nodes';

import {StorageControls} from './StorageControls/StorageControls';
import {StorageGroups} from './StorageGroups/StorageGroups';
import {StorageNodes} from './StorageNodes/StorageNodes';
import {b} from './shared';
import {defaultSortNode, getDefaultSortGroup} from './utils';

import './Storage.scss';

const UsageFilterParam = withDefault(
    {
        encode: ArrayParam.encode,
        decode: (input) => {
            if (input === null || input === undefined) {
                return input;
            }

            if (!Array.isArray(input)) {
                return input ? [input] : [];
            }
            return input.filter(Boolean) as string[];
        },
    },
    [],
);

interface StorageProps {
    additionalNodesProps?: AdditionalNodesProps;
    tenant?: string;
    nodeId?: string;
}

export const Storage = ({additionalNodesProps, tenant, nodeId}: StorageProps) => {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const [queryParams, setQueryParams] = useQueryParams({
        type: StringParam,
        visible: StringParam,
        search: StringParam,
        uptimeFilter: StringParam,
        usageFilter: UsageFilterParam,
    });
    const type = storageTypeSchema.parse(queryParams.type);
    const visibleEntities = visibleEntitiesSchema.parse(queryParams.visible);
    const filter = queryParams.search ?? '';
    const uptimeFilter = nodesUptimeFilterValuesSchema.parse(queryParams.uptimeFilter);
    const usageFilter = queryParams.usageFilter;

    const nodesMap = useTypedSelector(selectNodesMap);

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

    // Do not display Nodes table for Node page (NodeId present)
    const isNodePage = nodeId !== undefined;
    const storageType = isNodePage ? STORAGE_TYPES.groups : type;

    const nodesQuery = storageApi.useGetStorageNodesInfoQuery(
        {tenant, visibleEntities},
        {
            skip: storageType !== STORAGE_TYPES.nodes,
            pollingInterval: autoRefreshInterval,
        },
    );
    const groupsQuery = storageApi.useGetStorageGroupsInfoQuery(
        {tenant, visibleEntities, nodeId},
        {
            skip: storageType !== STORAGE_TYPES.groups,
            pollingInterval: autoRefreshInterval,
        },
    );

    const {currentData, isFetching, error} =
        storageType === STORAGE_TYPES.nodes ? nodesQuery : groupsQuery;

    const {currentData: {nodes = []} = {}} = nodesQuery;
    const {currentData: {groups = []} = {}} = groupsQuery;
    const {nodes: _, groups: __, ...entitiesCount} = currentData ?? {found: 0, total: 0};

    const isLoading = currentData === undefined && isFetching;

    const storageNodes = React.useMemo(
        () => filterNodes(nodes, filter, uptimeFilter),
        [filter, nodes, uptimeFilter],
    );
    const storageGroups = React.useMemo(
        () => filterGroups(groups, filter, usageFilter),
        [filter, groups, usageFilter],
    );

    const usageFilterOptions = React.useMemo(() => getUsageFilterOptions(groups), [groups]);

    const [nodesSort, handleNodesSort] = useTableSort(nodesSortParams, (params) =>
        setNodeSort(params as NodesSortParams),
    );
    const [groupsSort, handleGroupsSort] = useTableSort(groupsSortParams, (params) =>
        setGroupSort(params as StorageSortParams),
    );

    const handleUsageFilterChange = (value: string[]) => {
        setQueryParams({usageFilter: value.length ? value : undefined}, 'replaceIn');
    };

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
                {storageType === STORAGE_TYPES.groups && (
                    <StorageGroups
                        key="groups"
                        visibleEntities={visibleEntities}
                        data={storageGroups}
                        tableSettings={DEFAULT_TABLE_SETTINGS}
                        nodes={nodesMap}
                        onShowAll={() => handleGroupVisibilityChange(VISIBLE_ENTITIES.all)}
                        sort={groupsSort}
                        handleSort={handleGroupsSort}
                    />
                )}
                {storageType === STORAGE_TYPES.nodes && (
                    <StorageNodes
                        key="nodes"
                        visibleEntities={visibleEntities}
                        nodesUptimeFilter={uptimeFilter}
                        data={storageNodes}
                        tableSettings={DEFAULT_TABLE_SETTINGS}
                        onShowAll={handleShowAllNodes}
                        additionalNodesProps={additionalNodesProps}
                        sort={nodesSort}
                        handleSort={handleNodesSort}
                    />
                )}
            </React.Fragment>
        );
    };

    const renderControls = () => {
        return (
            <StorageControls
                searchValue={filter}
                handleSearchValueChange={handleTextFilterChange}
                withTypeSelector={!isNodePage}
                storageType={storageType}
                handleStorageTypeChange={handleStorageTypeChange}
                visibleEntities={visibleEntities}
                handleVisibleEntitiesChange={handleGroupVisibilityChange}
                nodesUptimeFilter={uptimeFilter}
                handleNodesUptimeFilterChange={handleUptimeFilterChange}
                groupsUsageFilter={usageFilter}
                groupsUsageFilterOptions={usageFilterOptions}
                handleGroupsUsageFilterChange={handleUsageFilterChange}
                entitiesCountCurrent={
                    storageType === STORAGE_TYPES.groups
                        ? storageGroups.length
                        : storageNodes.length
                }
                entitiesCountTotal={entitiesCount.total}
                entitiesLoading={isLoading}
            />
        );
    };

    if (error) {
        if ((error as any).status === 403) {
            return <AccessDenied position="left" />;
        }

        return <ResponseError error={error} />;
    }

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls>{renderControls()}</TableWithControlsLayout.Controls>
            <TableWithControlsLayout.Table loading={isLoading} className={b('table')}>
                {renderDataTable()}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
};
