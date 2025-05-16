import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';

import {PaginatedStorageGroups} from './PaginatedStorageGroups';
import {PaginatedStorageNodes} from './PaginatedStorageNodes';
import type {StorageViewContext} from './types';
import {useStorageQueryParams} from './useStorageQueryParams';
import {getStorageGroupsInitialEntitiesCount, getStorageNodesInitialEntitiesCount} from './utils';

export interface PaginatedStorageProps {
    database?: string;
    nodeId?: string | number;
    groupId?: string | number;
    pDiskId?: string | number;

    viewContext?: StorageViewContext;

    scrollContainerRef: React.RefObject<HTMLElement>;

    initialEntitiesCount?: number;
}

export const PaginatedStorage = (props: PaginatedStorageProps) => {
    const {storageType} = useStorageQueryParams();
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();

    const isNodes = storageType === 'nodes';

    // Hide storage node details for users with only viewer rights
    if (isNodes && isUserAllowedToMakeChanges) {
        return (
            <PaginatedStorageNodes
                initialEntitiesCount={getStorageNodesInitialEntitiesCount(props.viewContext)}
                {...props}
            />
        );
    }

    return (
        <PaginatedStorageGroups
            initialEntitiesCount={getStorageGroupsInitialEntitiesCount(props.viewContext)}
            {...props}
        />
    );
};
