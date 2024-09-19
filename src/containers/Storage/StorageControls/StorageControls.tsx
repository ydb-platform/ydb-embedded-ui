import React from 'react';

import type {TableColumnSetupItem} from '@gravity-ui/uikit';
import {TableColumnSetup} from '@gravity-ui/uikit';

import {EntitiesCount} from '../../../components/EntitiesCount/EntitiesCount';
import {Search} from '../../../components/Search/Search';
import {UptimeFilter} from '../../../components/UptimeFIlter';
import {STORAGE_TYPES} from '../../../store/reducers/storage/constants';
import type {StorageType, VisibleEntities} from '../../../store/reducers/storage/types';
import type {NodesUptimeFilterValues} from '../../../utils/nodes';
import {StorageTypeFilter} from '../StorageTypeFilter/StorageTypeFilter';
import {StorageVisibleEntitiesFilter} from '../StorageVisibleEntitiesFilter/StorageVisibleEntitiesFilter';
import {UsageFilter} from '../UsageFilter/UsageFilter';
import type {UsageFilterItem} from '../UsageFilter/UsageFilter';
import i18n from '../i18n';
import {b} from '../shared';

interface StorageControlsProps {
    searchValue?: string;
    handleSearchValueChange: (value: string) => void;

    withTypeSelector?: boolean;
    storageType: StorageType;
    handleStorageTypeChange: (value: StorageType) => void;

    visibleEntities: VisibleEntities;
    handleVisibleEntitiesChange: (value: VisibleEntities) => void;

    nodesUptimeFilter: NodesUptimeFilterValues;
    handleNodesUptimeFilterChange: (value: NodesUptimeFilterValues) => void;

    withGroupsUsageFilter?: boolean;
    groupsUsageFilter?: string[];
    groupsUsageFilterOptions?: UsageFilterItem[];
    handleGroupsUsageFilterChange?: (value: string[]) => void;

    entitiesCountCurrent: number;
    entitiesCountTotal?: number;
    entitiesLoading: boolean;

    columnsToSelect: TableColumnSetupItem[];
    handleSelectedColumnsUpdate: (updated: TableColumnSetupItem[]) => void;
}

export const StorageControls = ({
    searchValue,
    handleSearchValueChange,

    withTypeSelector,
    storageType,
    handleStorageTypeChange,

    visibleEntities,
    handleVisibleEntitiesChange,

    nodesUptimeFilter,
    handleNodesUptimeFilterChange,

    withGroupsUsageFilter,
    groupsUsageFilter,
    groupsUsageFilterOptions,
    handleGroupsUsageFilterChange,

    entitiesCountCurrent,
    entitiesCountTotal,
    entitiesLoading,

    columnsToSelect,
    handleSelectedColumnsUpdate,
}: StorageControlsProps) => {
    const isNodes = storageType === STORAGE_TYPES.nodes;
    const isGroups = storageType === STORAGE_TYPES.groups;
    const entityName = isNodes ? i18n('nodes') : i18n('groups');

    return (
        <React.Fragment>
            <Search
                value={searchValue}
                onChange={handleSearchValueChange}
                placeholder={
                    isNodes
                        ? i18n('controls_nodes-search-placeholder')
                        : i18n('controls_groups-search-placeholder')
                }
                className={b('search')}
            />
            {withTypeSelector && (
                <StorageTypeFilter value={storageType} onChange={handleStorageTypeChange} />
            )}
            <StorageVisibleEntitiesFilter
                value={visibleEntities}
                onChange={handleVisibleEntitiesChange}
            />

            {isNodes && (
                <UptimeFilter value={nodesUptimeFilter} onChange={handleNodesUptimeFilterChange} />
            )}
            {isGroups && withGroupsUsageFilter && (
                <UsageFilter
                    value={groupsUsageFilter}
                    onChange={handleGroupsUsageFilterChange}
                    groups={groupsUsageFilterOptions}
                />
            )}

            <EntitiesCount
                label={entityName}
                loading={entitiesLoading}
                total={entitiesCountTotal}
                current={entitiesCountCurrent}
            />
            <TableColumnSetup
                popupWidth={200}
                items={columnsToSelect}
                showStatus
                onUpdate={handleSelectedColumnsUpdate}
                sortable={false}
            />
        </React.Fragment>
    );
};
