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

    parentRef: React.RefObject<HTMLElement>;

    initialEntitiesCount?: number;
}

export const PaginatedStorage = (props: PaginatedStorageProps) => {
    const {storageType} = useStorageQueryParams();

    const isNodes = storageType === 'nodes';

    if (isNodes) {
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
