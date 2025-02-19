import React from 'react';

import type {TableColumnSetupItem} from '@gravity-ui/uikit';
import {Select, TableColumnSetup, Text} from '@gravity-ui/uikit';

import {EntitiesCount} from '../../../components/EntitiesCount/EntitiesCount';
import {Search} from '../../../components/Search/Search';
import {UptimeFilter} from '../../../components/UptimeFIlter';
import {useIsUserAllowedToMakeChanges} from '../../../utils/hooks/useIsUserAllowedToMakeChanges';
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
        handleStorageGroupsGroupByParamChange,
    } = useStorageQueryParams();

    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();

    const handleGroupBySelectUpdate = (value: string[]) => {
        handleStorageGroupsGroupByParamChange(value[0]);
    };

    const displayTypeSelector = withTypeSelector && isUserAllowedToMakeChanges;

    return (
        <React.Fragment>
            <Search
                value={searchValue}
                onChange={handleTextFilterChange}
                placeholder={i18n('controls_groups-search-placeholder')}
                className={b('search')}
            />
            {displayTypeSelector && (
                <StorageTypeFilter value={storageType} onChange={handleStorageTypeChange} />
            )}
            {withGroupBySelect ? null : (
                <StorageVisibleEntitiesFilter
                    value={visibleEntities}
                    onChange={handleVisibleEntitiesChange}
                />
            )}
            <TableColumnSetup
                popupWidth={200}
                items={columnsToSelect}
                showStatus
                onUpdate={handleSelectedColumnsUpdate}
                sortable={false}
            />
            {withGroupBySelect ? (
                <React.Fragment>
                    <Text variant="body-2">{i18n('controls_group-by-placeholder')}</Text>
                    <Select
                        hasClear
                        placeholder={'-'}
                        width={150}
                        defaultValue={
                            storageGroupsGroupByParam ? [storageGroupsGroupByParam] : undefined
                        }
                        onUpdate={handleGroupBySelectUpdate}
                        options={STORAGE_GROUPS_GROUP_BY_OPTIONS}
                    />
                </React.Fragment>
            ) : null}
            <EntitiesCount
                label={i18n('groups')}
                loading={entitiesLoading}
                total={entitiesCountTotal}
                current={entitiesCountCurrent}
            />
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
            <TableColumnSetup
                popupWidth={200}
                items={columnsToSelect}
                showStatus
                onUpdate={handleSelectedColumnsUpdate}
                sortable={false}
            />
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
