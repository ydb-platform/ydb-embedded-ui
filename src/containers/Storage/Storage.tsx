import {useCallback, useEffect} from 'react';
import {useDispatch} from 'react-redux';
import cn from 'bem-cn-lite';

import DataTable, {Settings} from '@gravity-ui/react-data-table';

import {Search} from '../../components/Search';
import {TableSkeleton} from '../../components/TableSkeleton/TableSkeleton';
import {UptimeFilter} from '../../components/UptimeFIlter';
import {AccessDenied} from '../../components/Errors/403';
import {EntitiesCount} from '../../components/EntitiesCount';

import type {StorageType, VisibleEntities} from '../../store/reducers/storage/types';
import {
    getStorageInfo,
    setInitialState,
    setVisibleEntities,
    setStorageTextFilter,
    setUsageFilter,
    setStorageType,
    setNodesUptimeFilter,
    setDataWasNotLoaded,
} from '../../store/reducers/storage/storage';
import {
    selectFilteredGroups,
    selectFilteredNodes,
    selectStorageNodesCount,
    selectStorageGroupsCount,
    selectUsageFilterOptions,
} from '../../store/reducers/storage/selectors';
import {VISIBLE_ENTITIES, STORAGE_TYPES} from '../../store/reducers/storage/constants';
import {getNodesList, selectNodesMap} from '../../store/reducers/nodesList';
import {useAutofetcher, useTypedSelector} from '../../utils/hooks';
import {AdditionalNodesInfo, NodesUptimeFilterValues} from '../../utils/nodes';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';

import {StorageGroups} from './StorageGroups/StorageGroups';
import {StorageNodes} from './StorageNodes/StorageNodes';
import {StorageTypeFilter} from './StorageTypeFilter/StorageTypeFilter';
import {StorageVisibleEntityFilter} from './StorageVisibleEntityFilter/StorageVisibleEntityFilter';
import {UsageFilter} from './UsageFilter';

import './Storage.scss';

const b = cn('global-storage');

const tableSettings: Settings = {
    ...DEFAULT_TABLE_SETTINGS,
    defaultOrder: DataTable.DESCENDING,
};

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
    const nodesCount = useTypedSelector(selectStorageNodesCount);
    const groupsCount = useTypedSelector(selectStorageGroupsCount);
    const nodesMap = useTypedSelector(selectNodesMap);
    const usageFilterOptions = useTypedSelector(selectUsageFilterOptions);

    useEffect(() => {
        dispatch(getNodesList());

        return () => {
            // Clean data on component unmount
            dispatch(setInitialState());
        };
    }, [dispatch]);

    const fetchData = useCallback(
        (isBackground: boolean) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }

            dispatch(
                getStorageInfo(
                    {
                        tenant,
                        nodeId,
                        visibleEntities,
                        type: storageType,
                    },
                    {
                        concurrentId: 'getStorageInfo',
                    },
                ),
            );
        },
        [dispatch, tenant, nodeId, visibleEntities, storageType],
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

    const renderLoader = () => {
        return <TableSkeleton className={b('loader')} />;
    };

    const renderDataTable = () => {
        return (
            <div className={b('table-wrapper')}>
                {storageType === STORAGE_TYPES.groups && (
                    <StorageGroups
                        visibleEntities={visibleEntities}
                        data={storageGroups}
                        tableSettings={tableSettings}
                        nodes={nodesMap}
                        onShowAll={() => handleGroupVisibilityChange(VISIBLE_ENTITIES.all)}
                    />
                )}
                {storageType === STORAGE_TYPES.nodes && (
                    <StorageNodes
                        visibleEntities={visibleEntities}
                        nodesUptimeFilter={nodesUptimeFilter}
                        data={storageNodes}
                        tableSettings={tableSettings}
                        onShowAll={handleShowAllNodes}
                        additionalNodesInfo={additionalNodesInfo}
                    />
                )}
            </div>
        );
    };

    const renderEntitiesCount = () => {
        const entityName = storageType === STORAGE_TYPES.groups ? 'Groups' : 'Nodes';
        const count = storageType === STORAGE_TYPES.groups ? groupsCount : nodesCount;
        const current =
            storageType === STORAGE_TYPES.groups ? storageGroups.length : storageNodes.length;

        return (
            <EntitiesCount
                label={entityName}
                loading={loading && !wasLoaded}
                total={count.total}
                current={current}
            />
        );
    };

    const renderControls = () => {
        return (
            <div className={b('controls')}>
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
                <StorageVisibleEntityFilter
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
            </div>
        );
    };

    const showLoader = loading && !wasLoaded;

    if (error) {
        if (error.status === 403) {
            return <AccessDenied />;
        }

        return <div className={b()}>{error.statusText}</div>;
    }

    return (
        <div className={b()}>
            {renderControls()}
            {showLoader ? renderLoader() : renderDataTable()}
        </div>
    );
};
