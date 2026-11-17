import React from 'react';

import {LoaderWrapper} from '../../../components/LoaderWrapper/LoaderWrapper';
import {
    useBridgeModeEnabled,
    useCapabilitiesLoaded,
    useStorageGroupsHandlerHasBridgeSyncGrouping,
    useStorageGroupsHandlerHasGrouping,
} from '../../../store/reducers/capabilities/hooks';
import {useTenantBaseInfo} from '../../../store/reducers/tenant/tenant';
import type {PaginatedStorageProps} from '../PaginatedStorage';
import {
    BRIDGE_STORAGE_GROUP_BY_FIELDS,
    isBridgeModeEnabledForStorage,
} from '../PaginatedStorageGroupsTable/columns/constants';
import {useStorageQueryParams} from '../useStorageQueryParams';

import {GroupedStorageGroupsComponent} from './GroupedStorageGroupsComponent';
import {StorageGroupsComponent} from './StorageGroupsComponent';

import '../Storage.scss';

export function PaginatedStorageGroups(props: PaginatedStorageProps) {
    const {
        storageGroupsGroupByParam,
        visibleEntities,
        handleShowAllGroups,
        handleStorageGroupsGroupByParamChange,
    } = useStorageQueryParams();

    const capabilitiesLoaded = useCapabilitiesLoaded();
    const storageGroupsHandlerHasGrouping = useStorageGroupsHandlerHasGrouping();
    const bridgeSyncGroupingAvailable = useStorageGroupsHandlerHasBridgeSyncGrouping();
    const clusterBridgeModeEnabled = useBridgeModeEnabled();
    const {databaseData, isError} = useTenantBaseInfo(props.database ?? '', undefined, {
        skip: !capabilitiesLoaded,
    });
    const bridgeModeEnabled = isBridgeModeEnabledForStorage(
        props.database,
        databaseData?.BridgeMode,
        clusterBridgeModeEnabled,
    );
    const bridgeGroupingSelected = BRIDGE_STORAGE_GROUP_BY_FIELDS.some(
        (field) => field === storageGroupsGroupByParam,
    );
    const bridgeModeResolved = !props.database || databaseData !== undefined || isError;
    const groupingUnavailable =
        bridgeGroupingSelected &&
        (!bridgeModeEnabled ||
            (storageGroupsGroupByParam === 'BridgeSyncStatus' && !bridgeSyncGroupingAvailable));

    React.useEffect(() => {
        if (capabilitiesLoaded && bridgeModeResolved && groupingUnavailable) {
            handleStorageGroupsGroupByParamChange('');
        }
    }, [
        capabilitiesLoaded,
        bridgeModeResolved,
        groupingUnavailable,
        handleStorageGroupsGroupByParamChange,
    ]);

    // Other filters do not fit with grouping
    // Reset them if grouping available
    React.useEffect(() => {
        if (storageGroupsHandlerHasGrouping && visibleEntities !== 'all') {
            handleShowAllGroups();
        }
    }, [handleShowAllGroups, storageGroupsHandlerHasGrouping, visibleEntities]);

    const renderContent = () => {
        if (storageGroupsHandlerHasGrouping && storageGroupsGroupByParam && !groupingUnavailable) {
            return (
                <GroupedStorageGroupsComponent
                    {...props}
                    bridgeSyncGroupingAvailable={bridgeSyncGroupingAvailable}
                />
            );
        }

        return (
            <StorageGroupsComponent
                {...props}
                bridgeSyncGroupingAvailable={bridgeSyncGroupingAvailable}
            />
        );
    };

    return (
        <LoaderWrapper
            loading={!capabilitiesLoaded || (bridgeGroupingSelected && !bridgeModeResolved)}
        >
            {renderContent()}
        </LoaderWrapper>
    );
}
