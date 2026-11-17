import React from 'react';

import {LoaderWrapper} from '../../../components/LoaderWrapper/LoaderWrapper';
import {
    useCapabilitiesLoaded,
    useStorageGroupsHandlerHasBridgeSyncGrouping,
    useStorageGroupsHandlerHasGrouping,
} from '../../../store/reducers/capabilities/hooks';
import type {PaginatedStorageProps} from '../PaginatedStorage';
import {BRIDGE_STORAGE_GROUP_BY_FIELDS} from '../PaginatedStorageGroupsTable/columns/constants';
import {useStorageQueryParams} from '../useStorageQueryParams';

import {GroupedStorageGroupsComponent} from './GroupedStorageGroupsComponent';
import {StorageGroupsComponent} from './StorageGroupsComponent';

import '../Storage.scss';

export function PaginatedStorageGroups({bridgeModeEnabled, ...props}: PaginatedStorageProps) {
    const {storageGroupsGroupByParam, visibleEntities, handleShowAllGroups} =
        useStorageQueryParams();

    const capabilitiesLoaded = useCapabilitiesLoaded();
    const storageGroupsHandlerHasGrouping = useStorageGroupsHandlerHasGrouping();
    const bridgeSyncGroupingAvailable = useStorageGroupsHandlerHasBridgeSyncGrouping();
    const bridgeGroupingSelected = BRIDGE_STORAGE_GROUP_BY_FIELDS.some(
        (field) => field === storageGroupsGroupByParam,
    );
    const groupingUnavailable =
        bridgeGroupingSelected &&
        (!bridgeModeEnabled ||
            (storageGroupsGroupByParam === 'BridgeSyncStatus' && !bridgeSyncGroupingAvailable));

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
                    bridgeModeEnabled={bridgeModeEnabled}
                    bridgeSyncGroupingAvailable={bridgeSyncGroupingAvailable}
                />
            );
        }

        return (
            <StorageGroupsComponent
                {...props}
                bridgeModeEnabled={bridgeModeEnabled}
                bridgeSyncGroupingAvailable={bridgeSyncGroupingAvailable}
            />
        );
    };

    return <LoaderWrapper loading={!capabilitiesLoaded}>{renderContent()}</LoaderWrapper>;
}
