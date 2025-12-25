import React from 'react';

import {Select, Text} from '@gravity-ui/uikit';

import {EntitiesCount} from '../../../components/EntitiesCount/EntitiesCount';
import {usePaginatedTableState} from '../../../components/PaginatedTable/PaginatedTableContext';
import {Search} from '../../../components/Search/Search';
import {UptimeFilter} from '../../../components/UptimeFIlter';
import {SETTING_KEYS} from '../../../store/reducers/settings/constants';
import {useSetting} from '../../../utils/hooks';
import {STORAGE_NODES_GROUP_BY_OPTIONS} from '../PaginatedStorageNodesTable/columns/constants';
import {StorageTypeFilter} from '../StorageTypeFilter/StorageTypeFilter';
import {StorageVisibleEntitiesFilter} from '../StorageVisibleEntitiesFilter/StorageVisibleEntitiesFilter';
import i18n from '../i18n';
import {b} from '../shared';
import {useStorageQueryParams} from '../useStorageQueryParams';

interface StorageControlsProps {
    withTypeSelector?: boolean;
    withGroupBySelect?: boolean;

    entitiesCountCurrent: number;
    entitiesCountTotal?: number;
    entitiesLoading: boolean;
}

export function StorageNodesControls({
    withTypeSelector,
    withGroupBySelect,

    entitiesCountCurrent,
    entitiesCountTotal,
    entitiesLoading,
}: StorageControlsProps) {
    const {
        nodesSearchValue,
        storageType,
        visibleEntities,
        nodesUptimeFilter,
        storageNodesGroupByParam,
        handleTextFilterNodesChange,
        handleStorageTypeChange,
        handleVisibleEntitiesChange,
        handleUptimeFilterChange,
        handleStorageNodesGroupByParamChange,
    } = useStorageQueryParams();

    const [blobMetricsEnabled] = useSetting<boolean>(
        SETTING_KEYS.ENABLE_BLOB_STORAGE_CAPACITY_METRICS,
        false,
    );

    const nodesGroupByOptions = React.useMemo(() => {
        if (blobMetricsEnabled) {
            return STORAGE_NODES_GROUP_BY_OPTIONS;
        }
        return STORAGE_NODES_GROUP_BY_OPTIONS.filter((opt) => opt.value !== 'CapacityAlert');
    }, [blobMetricsEnabled]);

    const handleGroupBySelectUpdate = (value: string[]) => {
        handleStorageNodesGroupByParamChange(value[0]);
    };

    return (
        <React.Fragment>
            <Search
                value={nodesSearchValue}
                onChange={handleTextFilterNodesChange}
                placeholder={i18n('controls_nodes-search-placeholder')}
                className={b('search')}
            />
            {withTypeSelector && (
                <StorageTypeFilter value={storageType} onChange={handleStorageTypeChange} />
            )}
            {withGroupBySelect ? null : (
                <StorageVisibleEntitiesFilter
                    value={visibleEntities}
                    onChange={handleVisibleEntitiesChange}
                />
            )}
            {withGroupBySelect ? null : (
                <UptimeFilter value={nodesUptimeFilter} onChange={handleUptimeFilterChange} />
            )}
            {withGroupBySelect ? (
                <React.Fragment>
                    <Text variant="body-2">{i18n('controls_group-by-placeholder')}</Text>
                    <Select
                        hasClear
                        placeholder={'-'}
                        width={150}
                        defaultValue={
                            storageNodesGroupByParam ? [storageNodesGroupByParam] : undefined
                        }
                        onUpdate={handleGroupBySelectUpdate}
                        options={nodesGroupByOptions}
                    />
                </React.Fragment>
            ) : null}
            <EntitiesCount
                label={i18n('nodes')}
                loading={entitiesLoading}
                total={entitiesCountTotal}
                current={entitiesCountCurrent}
            />
        </React.Fragment>
    );
}

export function StorageNodesControlsWithTableState({
    withTypeSelector,
    withGroupBySelect,
}: {
    withTypeSelector?: boolean;
    withGroupBySelect?: boolean;
}) {
    const {tableState} = usePaginatedTableState();

    return (
        <StorageNodesControls
            withTypeSelector={withTypeSelector}
            withGroupBySelect={withGroupBySelect}
            entitiesCountCurrent={tableState.foundEntities}
            entitiesCountTotal={tableState.totalEntities}
            entitiesLoading={tableState.isInitialLoad}
        />
    );
}
