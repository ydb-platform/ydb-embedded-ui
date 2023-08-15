import {useCallback, useEffect} from 'react';
import {useDispatch} from 'react-redux';
import cn from 'bem-cn-lite';

import {Search} from '../../components/Search';
import {UptimeFilter} from '../../components/UptimeFIlter';
import {AccessDenied} from '../../components/Errors/403';
import {EntitiesCount} from '../../components/EntitiesCount';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {ResponseError} from '../../components/Errors/ResponseError';

import type {
    StorageSortParams,
    StorageType,
    VisibleEntities,
} from '../../store/reducers/storage/types';
import type {NodesSortParams} from '../../store/reducers/nodes/types';
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
import {getNodesList, selectNodesMap} from '../../store/reducers/nodesList';
import {
    useAutofetcher,
    useNodesRequestParams,
    useStorageRequestParams,
    useTableSort,
    useTypedSelector,
} from '../../utils/hooks';
import {AdditionalNodesInfo, NodesUptimeFilterValues} from '../../utils/nodes';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';

import {StorageGroups} from './StorageGroups/StorageGroups';
import {StorageNodes} from './StorageNodes/StorageNodes';
import {StorageTypeFilter} from './StorageTypeFilter/StorageTypeFilter';
import {StorageVisibleEntitiesFilter} from './StorageVisibleEntitiesFilter/StorageVisibleEntitiesFilter';
import {UsageFilter} from './UsageFilter';

import './Storage.scss';

const b = cn('global-storage');

interface StorageProps {
    additionalNodesInfo?: AdditionalNodesInfo;
    tenant?: string;
    nodeId?: string;
}

export const Storage = ({additionalNodesInfo, tenant, nodeId}: StorageProps) => {
    const dispatch = useDispatch();

    const {autorefresh} = useTypedSelector((state) => state.schema);
    const {
        loading,
        wasLoaded,
        error,
        type: storageType,
        visible: visibleEntities,
        filter,
        usageFilter,
        nodesUptimeFilter,
    } = useTypedSelector((state) => state.storage);
    const storageNodes = useTypedSelector(selectFilteredNodes);
    const storageGroups = useTypedSelector(selectFilteredGroups);
    const entitiesCount = useTypedSelector(selectEntitiesCount);
    const nodesMap = useTypedSelector(selectNodesMap);
    const usageFilterOptions = useTypedSelector(selectUsageFilterOptions);
    const nodesSortParams = useTypedSelector(selectNodesSortParams);
    const groupsSortParams = useTypedSelector(selectGroupsSortParams);

    useEffect(() => {
        dispatch(getNodesList());

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

    const handleGroupVisibilityChange = (value: string) => {
        dispatch(setVisibleEntities(value as VisibleEntities));
    };

    const handleStorageTypeChange = (value: string) => {
        dispatch(setStorageType(value as StorageType));
    };

    const handleUptimeFilterChange = (value: string) => {
        dispatch(setNodesUptimeFilter(value as NodesUptimeFilterValues));
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
                        additionalNodesInfo={additionalNodesInfo}
                        sort={nodesSort}
                        handleSort={handleNodesSort}
                    />
                )}
            </>
        );
    };

    const renderEntitiesCount = () => {
        const entityName = storageType === STORAGE_TYPES.groups ? 'Groups' : 'Nodes';
        const current =
            storageType === STORAGE_TYPES.groups ? storageGroups.length : storageNodes.length;

        return (
            <EntitiesCount
                label={entityName}
                loading={loading && !wasLoaded}
                total={entitiesCount.total}
                current={current}
            />
        );
    };

    const renderControls = () => {
        return (
            <>
                <div className={b('search')}>
                    <Search
                        placeholder={
                            storageType === STORAGE_TYPES.groups
                                ? 'Group ID, Pool name'
                                : 'Node ID, FQDN'
                        }
                        onChange={handleTextFilterChange}
                        value={filter}
                    />
                </div>

                <StorageTypeFilter value={storageType} onChange={handleStorageTypeChange} />
                <StorageVisibleEntitiesFilter
                    value={visibleEntities}
                    onChange={handleGroupVisibilityChange}
                />

                {storageType === STORAGE_TYPES.nodes && (
                    <UptimeFilter value={nodesUptimeFilter} onChange={handleUptimeFilterChange} />
                )}

                {storageType === STORAGE_TYPES.groups && (
                    <UsageFilter
                        value={usageFilter}
                        onChange={handleUsageFilterChange}
                        groups={usageFilterOptions}
                        disabled={usageFilterOptions.length === 0}
                    />
                )}
                {renderEntitiesCount()}
            </>
        );
    };

    if (error) {
        if (error.status === 403) {
            return <AccessDenied />;
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
