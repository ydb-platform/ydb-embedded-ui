import React from 'react';

import type {TableColumnSetupItem} from '@gravity-ui/uikit';
import {Select, TableColumnSetup, Text} from '@gravity-ui/uikit';

import {EntitiesCount} from '../../../components/EntitiesCount/EntitiesCount';
import {usePaginatedTableState} from '../../../components/PaginatedTable/PaginatedTableContext';
import {Search} from '../../../components/Search/Search';
import {useBridgeModeEnabled} from '../../../store/reducers/capabilities/hooks';
import {useIsUserAllowedToMakeChanges} from '../../../utils/hooks/useIsUserAllowedToMakeChanges';
import {STORAGE_GROUPS_GROUP_BY_OPTIONS} from '../PaginatedStorageGroupsTable/columns/constants';
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
    const bridgeModeEnabled = useBridgeModeEnabled();
    const groupByOptions = React.useMemo(() => {
        if (bridgeModeEnabled) {
            return STORAGE_GROUPS_GROUP_BY_OPTIONS;
        }
        return STORAGE_GROUPS_GROUP_BY_OPTIONS.filter((opt) => opt.value !== 'PileName');
    }, [bridgeModeEnabled]);

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
                        options={groupByOptions}
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

export function StorageGroupsControlsWithTableState({
    withTypeSelector,
    withGroupBySelect,
    columnsToSelect,
    handleSelectedColumnsUpdate,
}: {
    withTypeSelector?: boolean;
    withGroupBySelect?: boolean;
    columnsToSelect: any[];
    handleSelectedColumnsUpdate: (updated: any[]) => void;
}) {
    const {tableState} = usePaginatedTableState();

    return (
        <StorageGroupsControls
            withTypeSelector={withTypeSelector}
            withGroupBySelect={withGroupBySelect}
            entitiesCountCurrent={tableState.foundEntities}
            entitiesCountTotal={tableState.totalEntities}
            entitiesLoading={tableState.isInitialLoad}
            columnsToSelect={columnsToSelect}
            handleSelectedColumnsUpdate={handleSelectedColumnsUpdate}
        />
    );
}
