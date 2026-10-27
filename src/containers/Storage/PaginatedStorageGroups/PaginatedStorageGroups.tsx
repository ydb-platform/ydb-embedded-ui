import React from 'react';

import {LoaderWrapper} from '../../../components/LoaderWrapper/LoaderWrapper';
import {SearchProvider} from '../../../components/Search/SearchProvider';
import {
    useCapabilitiesLoaded,
    useStorageGroupsHandlerHasGrouping,
} from '../../../store/reducers/capabilities/hooks';
import type {PaginatedStorageProps} from '../PaginatedStorage';
import {storageQueryParams, useStorageQueryParams} from '../useStorageQueryParams';

import {GroupedStorageGroupsComponent} from './GroupedStorageGroupsComponent';
import {StorageGroupsComponent} from './StorageGroupsComponent';

import '../Storage.scss';

export function PaginatedStorageGroups(props: PaginatedStorageProps) {
    const {
        groupsSearchValue,
        handleTextFilterGroupsChange,
        storageGroupsGroupByParam,
        visibleEntities,
        handleShowAllGroups,
    } = useStorageQueryParams();

    const capabilitiesLoaded = useCapabilitiesLoaded();
    const storageGroupsHandlerHasGrouping = useStorageGroupsHandlerHasGrouping();

    // Other filters do not fit with grouping
    // Reset them if grouping available
    React.useEffect(() => {
        if (storageGroupsHandlerHasGrouping && visibleEntities !== 'all') {
            handleShowAllGroups();
        }
    }, [handleShowAllGroups, storageGroupsHandlerHasGrouping, visibleEntities]);

    const renderContent = () => {
        if (storageGroupsHandlerHasGrouping && storageGroupsGroupByParam) {
            return <GroupedStorageGroupsComponent {...props} />;
        }

        return <StorageGroupsComponent {...props} />;
    };

    return (
        <SearchProvider
            value={groupsSearchValue}
            onChange={handleTextFilterGroupsChange}
            queryParams={storageQueryParams}
            scope={JSON.stringify([
                props.database,
                props.nodeId,
                props.groupId,
                props.pDiskId,
                window.api.storage.getPath(''),
            ])}
        >
            <LoaderWrapper loading={!capabilitiesLoaded}>{renderContent()}</LoaderWrapper>
        </SearchProvider>
    );
}
