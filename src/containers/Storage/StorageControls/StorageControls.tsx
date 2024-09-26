import React from 'react';

import type {TableColumnSetupItem} from '@gravity-ui/uikit';
import {Select, TableColumnSetup} from '@gravity-ui/uikit';

import {EntitiesCount} from '../../../components/EntitiesCount/EntitiesCount';
import {Search} from '../../../components/Search/Search';
import {UptimeFilter} from '../../../components/UptimeFIlter';
import {STORAGE_GROUPS_GROUP_BY_OPTIONS} from '../StorageGroups/columns/constants';
import {STORAGE_NODES_GROUP_BY_OPTIONS} from '../StorageNodes/columns/constants';
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

    columnsToSelect: TableColumnSetupItem[];
    handleSelectedColumnsUpdate: (updated: TableColumnSetupItem[]) => void;
}

export function StorageGroupsControls({
    withTypeSelector,
    withGroupBySelect,

    entitiesCountCurrent,
    entitiesCountTotal,
    entitiesLoading,

    columnsToSelect,
    handleSelectedColumnsUpdate,
}: StorageControlsProps) {
    const {
        searchValue,
        storageType,
        visibleEntities,
        storageGroupsGroupByParam,
        handleTextFilterChange,
        handleStorageTypeChange,
        handleVisibleEntitiesChange,
        handleGroupByParamChange,
    } = useStorageQueryParams();

    const handleGroupBySelectUpdate = (value: string[]) => {
        handleGroupByParamChange(value[0]);
    };

    return (
        <React.Fragment>
            <Search
                value={searchValue}
                onChange={handleTextFilterChange}
                placeholder={i18n('controls_groups-search-placeholder')}
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
            <EntitiesCount
                label={i18n('groups')}
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
            {withGroupBySelect ? (
                <Select
                    hasClear
                    placeholder={'-'}
                    label={i18n('controls_group-by-placeholder')}
                    width={200}
                    defaultValue={
                        storageGroupsGroupByParam ? [storageGroupsGroupByParam] : undefined
                    }
                    onUpdate={handleGroupBySelectUpdate}
                    options={STORAGE_GROUPS_GROUP_BY_OPTIONS}
                />
            ) : null}
        </React.Fragment>
    );
}

export function StorageNodesControls({
    withTypeSelector,
    withGroupBySelect,

    entitiesCountCurrent,
    entitiesCountTotal,
    entitiesLoading,

    columnsToSelect,
    handleSelectedColumnsUpdate,
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
        handleGroupByParamChange,
    } = useStorageQueryParams();

    const handleGroupBySelectUpdate = (value: string[]) => {
        handleGroupByParamChange(value[0]);
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
            <EntitiesCount
                label={i18n('nodes')}
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
            {withGroupBySelect ? (
                <Select
                    hasClear
                    placeholder={'-'}
                    label={i18n('controls_group-by-placeholder')}
                    width={200}
                    defaultValue={storageNodesGroupByParam ? [storageNodesGroupByParam] : undefined}
                    onUpdate={handleGroupBySelectUpdate}
                    options={STORAGE_NODES_GROUP_BY_OPTIONS}
                />
            ) : null}
        </React.Fragment>
    );
}
