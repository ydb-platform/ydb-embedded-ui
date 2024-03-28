import {useCallback, useEffect} from 'react';

import {AccessDenied} from '../../components/Errors/403';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {ResponseError} from '../../components/Errors/ResponseError';
import {useClusterNodesMap} from '../../contexts/ClusterNodesMapContext/ClusterNodesMapContext';

import type {
    StorageSortParams,
    StorageType,
    VisibleEntities,
} from '../../store/reducers/storage/types';
import type {NodesSortParams} from '../../store/reducers/nodes/types';
import type {AdditionalNodesProps} from '../../types/additionalProps';
import {
    setInitialState,
    setVisibleEntities,
    setStorageTextFilter,
    setUsageFilter,
    setStorageType,
    setNodesUptimeFilter,
    setDataWasNotLoaded,
    getStorageNodesInfo,
    getStorageGroupsInfo,
    setNodesSortParams,
    setGroupsSortParams,
} from '../../store/reducers/storage/storage';
import {
    selectFilteredGroups,
    selectFilteredNodes,
    selectEntitiesCount,
    selectUsageFilterOptions,
    selectNodesSortParams,
    selectGroupsSortParams,
} from '../../store/reducers/storage/selectors';
import {VISIBLE_ENTITIES, STORAGE_TYPES} from '../../store/reducers/storage/constants';
import {
    useAutofetcher,
    useNodesRequestParams,
    useStorageRequestParams,
    useTableSort,
    useTypedSelector,
    useTypedDispatch,
} from '../../utils/hooks';
import {NodesUptimeFilterValues} from '../../utils/nodes';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';

import {StorageGroups} from './StorageGroups/StorageGroups';
import {StorageNodes} from './StorageNodes/StorageNodes';
import {StorageControls} from './StorageControls/StorageControls';
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
        loading,
        wasLoaded,
        error,
        type,
        visible: visibleEntities,
        filter,
        usageFilter,
        nodesUptimeFilter,
    } = useTypedSelector((state) => state.storage);
    const storageNodes = useTypedSelector(selectFilteredNodes);
    const storageGroups = useTypedSelector(selectFilteredGroups);
    const entitiesCount = useTypedSelector(selectEntitiesCount);
    const usageFilterOptions = useTypedSelector(selectUsageFilterOptions);
    const nodesSortParams = useTypedSelector(selectNodesSortParams);
    const groupsSortParams = useTypedSelector(selectGroupsSortParams);

    const nodesMap = useClusterNodesMap();

    // Do not display Nodes table for Node page (NodeId present)
    const isNodePage = nodeId !== undefined;
    const storageType = isNodePage ? STORAGE_TYPES.groups : type;

    useEffect(() => {
        return () => {
            // Clean data on component unmount
            dispatch(setInitialState());
        };
    }, [dispatch]);

    const nodesRequestParams = useNodesRequestParams({
        filter,
        nodesUptimeFilter,
        ...nodesSortParams,
    });
    const storageRequestParams = useStorageRequestParams({
        filter,
        ...groupsSortParams,
    });

    const [nodesSort, handleNodesSort] = useTableSort(nodesSortParams, (params) =>
        dispatch(setNodesSortParams(params as NodesSortParams)),
    );
    const [groupsSort, handleGroupsSort] = useTableSort(groupsSortParams, (params) =>
        dispatch(setGroupsSortParams(params as StorageSortParams)),
    );

    const fetchData = useCallback(
        (isBackground: boolean) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }

            const nodesParams = nodesRequestParams || {};
            const storageParams = storageRequestParams || {};

            if (storageType === STORAGE_TYPES.nodes) {
                dispatch(getStorageNodesInfo({tenant, visibleEntities, ...nodesParams}));
            } else {
                dispatch(getStorageGroupsInfo({tenant, visibleEntities, nodeId, ...storageParams}));
            }
        },
        [
            dispatch,
            tenant,
            nodeId,
            visibleEntities,
            storageType,
            storageRequestParams,
            nodesRequestParams,
        ],
    );

    const autorefreshEnabled = tenant ? autorefresh : true;

    useAutofetcher(fetchData, [fetchData], autorefreshEnabled);

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
        dispatch(setNodesUptimeFilter(value));
    };

    const handleShowAllNodes = () => {
        handleGroupVisibilityChange(VISIBLE_ENTITIES.all);
        handleUptimeFilterChange(NodesUptimeFilterValues.All);
    };

    const renderDataTable = () => {
        return (
            <>
                {storageType === STORAGE_TYPES.groups && (
                    <StorageGroups
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
                        visibleEntities={visibleEntities}
                        nodesUptimeFilter={nodesUptimeFilter}
                        data={storageNodes}
                        tableSettings={DEFAULT_TABLE_SETTINGS}
                        onShowAll={handleShowAllNodes}
                        additionalNodesProps={additionalNodesProps}
                        sort={nodesSort}
                        handleSort={handleNodesSort}
                    />
                )}
            </>
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
                nodesUptimeFilter={nodesUptimeFilter}
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
                entitiesLoading={loading && !wasLoaded}
            />
        );
    };

    if (error) {
        if (error.status === 403) {
            return <AccessDenied position="left" />;
        }

        return <ResponseError error={error} />;
    }

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls>{renderControls()}</TableWithControlsLayout.Controls>
            <TableWithControlsLayout.Table loading={loading && !wasLoaded} className={b('table')}>
                {renderDataTable()}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
};
