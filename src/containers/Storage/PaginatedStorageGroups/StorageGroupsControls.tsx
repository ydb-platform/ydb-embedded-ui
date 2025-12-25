import React from 'react';

import {Select, Text} from '@gravity-ui/uikit';

import {EntitiesCount} from '../../../components/EntitiesCount/EntitiesCount';
import {usePaginatedTableState} from '../../../components/PaginatedTable/PaginatedTableContext';
import {Search} from '../../../components/Search/Search';
import {useBridgeModeEnabled} from '../../../store/reducers/capabilities/hooks';
import {SETTING_KEYS} from '../../../store/reducers/settings/constants';
import {useSetting} from '../../../utils/hooks';
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
}

export function StorageGroupsControls({
    withTypeSelector,
    withGroupBySelect,

    entitiesCountCurrent,
    entitiesCountTotal,
    entitiesLoading,
}: StorageControlsProps) {
    const {
        groupsSearchValue,
        storageType,
        visibleEntities,
        storageGroupsGroupByParam,
        handleTextFilterGroupsChange,
        handleStorageTypeChange,
        handleVisibleEntitiesChange,
        handleStorageGroupsGroupByParamChange,
    } = useStorageQueryParams();

    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();
    const bridgeModeEnabled = useBridgeModeEnabled();
    const [blobMetricsEnabled] = useSetting<boolean>(
        SETTING_KEYS.ENABLE_BLOB_STORAGE_CAPACITY_METRICS,
        false,
    );

    const groupByOptions = React.useMemo(() => {
        let options = STORAGE_GROUPS_GROUP_BY_OPTIONS;

        if (!bridgeModeEnabled) {
            options = options.filter((opt) => opt.value !== 'PileName');
        }

        if (!blobMetricsEnabled) {
            options = options.filter((opt) => opt.value !== 'CapacityAlert');
        }

        return options;
    }, [bridgeModeEnabled, blobMetricsEnabled]);

    const handleGroupBySelectUpdate = (value: string[]) => {
        handleStorageGroupsGroupByParamChange(value[0]);
    };

    const displayTypeSelector = withTypeSelector && isUserAllowedToMakeChanges;

    return (
        <React.Fragment>
            <Search
                value={groupsSearchValue}
                onChange={handleTextFilterGroupsChange}
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
}: {
    withTypeSelector?: boolean;
    withGroupBySelect?: boolean;
}) {
    const {tableState} = usePaginatedTableState();

    return (
        <StorageGroupsControls
            withTypeSelector={withTypeSelector}
            withGroupBySelect={withGroupBySelect}
            entitiesCountCurrent={tableState.foundEntities}
            entitiesCountTotal={tableState.totalEntities}
            entitiesLoading={tableState.isInitialLoad}
        />
    );
}
