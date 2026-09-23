import React from 'react';

import {ChartTreemap} from '@gravity-ui/icons';
import {Button, Flex, Icon, Select, Text} from '@gravity-ui/uikit';

import {EntitiesCount} from '../../../components/EntitiesCount/EntitiesCount';
import {usePaginatedTableState} from '../../../components/PaginatedTable/PaginatedTableContext';
import {Search} from '../../../components/Search/Search';
import {UptimeFilter} from '../../../components/UptimeFIlter';
import {
    useBlobStorageCapacityMetricsAvailable,
    useBlobStorageCapacityMetricsEnabled,
} from '../../../store/reducers/capabilities/hooks';
import {SETTING_KEYS} from '../../../store/reducers/settings/constants';
import {useSetting} from '../../../utils/hooks';
import {useIsUserAllowedToMakeChanges} from '../../../utils/hooks/useIsUserAllowedToMakeChanges';
import {getStorageNodesGroupByOptions} from '../PaginatedStorageNodesTable/columns/constants';
import {StorageNodesExpertModePanel} from '../StorageExpertModePanel/StorageNodesExpertModePanel';
import {StorageTypeFilter} from '../StorageTypeFilter/StorageTypeFilter';
import {StorageVisibleEntitiesFilter} from '../StorageVisibleEntitiesFilter/StorageVisibleEntitiesFilter';
import i18n from '../i18n';
import {b} from '../shared';
import {useIsStorageExpertMode, useStorageQueryParams} from '../useStorageQueryParams';

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
        handleStorageExpertModeChange,
    } = useStorageQueryParams();

    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();
    const [storageExpertModeSettingEnabled] = useSetting<boolean>(
        SETTING_KEYS.ENABLE_STORAGE_EXPERT_MODE,
    );
    const isStorageExpertMode = useIsStorageExpertMode();
    const storageExpertModeAvailable = useBlobStorageCapacityMetricsAvailable();
    const blobMetricsEnabled = useBlobStorageCapacityMetricsEnabled();

    const nodesGroupByOptions = React.useMemo(
        () => getStorageNodesGroupByOptions(blobMetricsEnabled),
        [blobMetricsEnabled],
    );

    const handleGroupBySelectUpdate = (value: string[]) => {
        handleStorageNodesGroupByParamChange(value[0]);
    };

    const canUseStorageExpertMode =
        storageExpertModeAvailable &&
        storageExpertModeSettingEnabled &&
        Boolean(isUserAllowedToMakeChanges);

    return (
        <Flex direction="column" gap={2} width="100%">
            <Flex gap={2} alignItems="center" wrap className={b('controls-row')}>
                <Search
                    tableFilter
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
                {canUseStorageExpertMode ? (
                    <Button
                        selected={isStorageExpertMode}
                        onClick={() => handleStorageExpertModeChange(!isStorageExpertMode)}
                    >
                        <Icon data={ChartTreemap} />
                        {i18n('controls_expert-mode')}
                    </Button>
                ) : null}
            </Flex>
            {canUseStorageExpertMode && isStorageExpertMode ? (
                <StorageNodesExpertModePanel />
            ) : null}
        </Flex>
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
