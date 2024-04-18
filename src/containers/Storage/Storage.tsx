import React from 'react';

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
    selectGroupsSortParams,
    selectNodesSortParams,
} from '../../store/reducers/storage/selectors';
import {
    setGroupsSortParams,
    setInitialState,
    setNodesSortParams,
    setStorageTextFilter,
    setStorageType,
    setUptimeFilter,
    setUsageFilter,
    setVisibleEntities,
    storageApi,
} from '../../store/reducers/storage/storage';
import type {
    StorageSortParams,
    StorageType,
    VisibleEntities,
} from '../../store/reducers/storage/types';
import type {AdditionalNodesProps} from '../../types/additionalProps';
import {DEFAULT_POLLING_INTERVAL, DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {
    useNodesRequestParams,
    useStorageRequestParams,
    useTableSort,
    useTypedDispatch,
    useTypedSelector,
} from '../../utils/hooks';
import {NodesUptimeFilterValues} from '../../utils/nodes';

import {StorageControls} from './StorageControls/StorageControls';
import {StorageGroups} from './StorageGroups/StorageGroups';
import {StorageNodes} from './StorageNodes/StorageNodes';
import {b} from './shared';

import './Storage.scss';

interface StorageProps {
    additionalNodesProps?: AdditionalNodesProps;
    tenant?: string;
    nodeId?: string;
}

export const Storage = ({additionalNodesProps, tenant, nodeId}: StorageProps) => {
    const dispatch = useTypedDispatch();

    const {autorefresh} = useTypedSelector((state) => state.schema);
    const {
        type,
        visible: visibleEntities,
        filter,
        usageFilter,
        uptimeFilter,
    } = useTypedSelector((state) => state.storage);

    const nodesMap = useTypedSelector(selectNodesMap);
    const nodesSortParams = useTypedSelector(selectNodesSortParams);
    const groupsSortParams = useTypedSelector(selectGroupsSortParams);

    // Do not display Nodes table for Node page (NodeId present)
    const isNodePage = nodeId !== undefined;
    const storageType = isNodePage ? STORAGE_TYPES.groups : type;

    const nodesRequestParams = useNodesRequestParams({
        filter,
        nodesUptimeFilter: uptimeFilter,
        ...nodesSortParams,
    });
    const storageRequestParams = useStorageRequestParams({
        filter,
        ...groupsSortParams,
    });

    const autoRefreshEnabled = tenant ? autorefresh : true;

    const nodesQuery = storageApi.useGetStorageNodesInfoQuery(
        {tenant, visibleEntities, ...nodesRequestParams},
        {
            skip: storageType !== STORAGE_TYPES.nodes,
            pollingInterval: autoRefreshEnabled ? DEFAULT_POLLING_INTERVAL : 0,
        },
    );
    const groupsQuery = storageApi.useGetStorageGroupsInfoQuery(
        {tenant, visibleEntities, nodeId, ...storageRequestParams},
        {
            skip: storageType !== STORAGE_TYPES.groups,
            pollingInterval: autoRefreshEnabled ? DEFAULT_POLLING_INTERVAL : 0,
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

    React.useEffect(() => {
        return () => {
            // Clean data on component unmount
            dispatch(setInitialState());
        };
    }, [dispatch]);

    const [nodesSort, handleNodesSort] = useTableSort(nodesSortParams, (params) =>
        dispatch(setNodesSortParams(params as NodesSortParams)),
    );
    const [groupsSort, handleGroupsSort] = useTableSort(groupsSortParams, (params) =>
        dispatch(setGroupsSortParams(params as StorageSortParams)),
    );

    const handleUsageFilterChange = (value: string[]) => {
        dispatch(setUsageFilter(value));
    };

    const handleTextFilterChange = (value: string) => {
        dispatch(setStorageTextFilter(value));
    };

    const handleGroupVisibilityChange = (value: VisibleEntities) => {
        dispatch(setVisibleEntities(value));
    };

    const handleStorageTypeChange = (value: StorageType) => {
        dispatch(setStorageType(value));
    };

    const handleUptimeFilterChange = (value: NodesUptimeFilterValues) => {
        dispatch(setUptimeFilter(value));
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
