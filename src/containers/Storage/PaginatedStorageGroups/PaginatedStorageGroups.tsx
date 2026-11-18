import React from 'react';

import {LoaderWrapper} from '../../../components/LoaderWrapper/LoaderWrapper';
import {
    useCapabilitiesLoaded,
    useStorageGroupsHandlerHasGrouping,
} from '../../../store/reducers/capabilities/hooks';
import type {PaginatedStorageProps} from '../PaginatedStorage';
import {useStorageQueryParams} from '../useStorageQueryParams';

import {GroupedStorageGroupsComponent} from './GroupedStorageGroupsComponent';
import {StorageGroupsComponent} from './StorageGroupsComponent';
import {useStorageGroupsBridgeGrouping} from './useStorageGroupsBridgeGrouping';

import '../Storage.scss';

export function PaginatedStorageGroups(props: PaginatedStorageProps) {
    const {storageGroupsGroupByParam, visibleEntities, handleShowAllGroups} =
        useStorageQueryParams();

    const capabilitiesLoaded = useCapabilitiesLoaded();
    const storageGroupsHandlerHasGrouping = useStorageGroupsHandlerHasGrouping();
    const {bridgeModeEnabled, bridgeSyncGroupingAvailable} = useStorageGroupsBridgeGrouping();
    const groupingUnavailable =
        (storageGroupsGroupByParam === 'PileName' && !bridgeModeEnabled) ||
        (storageGroupsGroupByParam === 'BridgeSyncStatus' && !bridgeSyncGroupingAvailable);

    // Other filters do not fit with grouping
    // Reset them if grouping available
    React.useEffect(() => {
        if (storageGroupsHandlerHasGrouping && visibleEntities !== 'all') {
            handleShowAllGroups();
        }
    }, [handleShowAllGroups, storageGroupsHandlerHasGrouping, visibleEntities]);

    const renderContent = () => {
        if (storageGroupsHandlerHasGrouping && storageGroupsGroupByParam && !groupingUnavailable) {
            return <GroupedStorageGroupsComponent {...props} />;
        }

        return <StorageGroupsComponent {...props} />;
    };

    return <LoaderWrapper loading={!capabilitiesLoaded}>{renderContent()}</LoaderWrapper>;
}
