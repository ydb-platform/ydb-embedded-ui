import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';

import {PaginatedStorageGroups} from './PaginatedStorageGroups';
import {PaginatedStorageNodes} from './PaginatedStorageNodes';
import type {StorageViewContext} from './types';
import {
    useSaveNodesPDisksGroupBy,
    useSaveNodesVDisksGroupBy,
    useSavePDisksGroupBy,
    useSaveStorageExpertMode,
    useSaveStorageType,
    useSaveVDisksGroupBy,
    useStorageQueryParams,
} from './useStorageQueryParams';
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
    useSaveStorageType();
    useSaveStorageExpertMode();
    useSaveVDisksGroupBy();
    useSavePDisksGroupBy();
    useSaveNodesVDisksGroupBy();
    useSaveNodesPDisksGroupBy();
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();

    const showNodes = storageType === 'nodes' && isUserAllowedToMakeChanges;

    // Hide storage node details for users with only viewer rights
    if (showNodes) {
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
