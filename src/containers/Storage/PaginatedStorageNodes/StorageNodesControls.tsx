import React from 'react';

import {Select, Text} from '@gravity-ui/uikit';

import {EntitiesCount} from '../../../components/EntitiesCount/EntitiesCount';
import {usePaginatedTableState} from '../../../components/PaginatedTable/PaginatedTableContext';
import {Search} from '../../../components/Search/Search';
import {UptimeFilter} from '../../../components/UptimeFIlter';
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
        searchValue,
        storageType,
        visibleEntities,
        nodesUptimeFilter,
        storageNodesGroupByParam,
        handleTextFilterChange,
        handleStorageTypeChange,
        handleVisibleEntitiesChange,
        handleUptimeFilterChange,
        handleStorageNodesGroupByParamChange,
    } = useStorageQueryParams();

    const handleGroupBySelectUpdate = (value: string[]) => {
        handleStorageNodesGroupByParamChange(value[0]);
    };

    return (
        <React.Fragment>
            <Search
                value={searchValue}
                onChange={handleTextFilterChange}
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
                        options={STORAGE_NODES_GROUP_BY_OPTIONS}
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
