import {PaginatedStorageGroups} from './PaginatedStorageGroups';
import {PaginatedStorageNodes} from './PaginatedStorageNodes';
import type {StorageViewContext} from './types';
import {useStorageQueryParams} from './useStorageQueryParams';

export interface PaginatedStorageProps {
    database?: string;
    nodeId?: string | number;
    groupId?: string | number;
    pDiskId?: string | number;

    viewContext: StorageViewContext;

    parentContainer?: Element | null;

    initialEntitiesCount?: number;
}

const DEFAULT_ENTITIES_COUNT = 10;

export const PaginatedStorage = (props: PaginatedStorageProps) => {
    const {storageType} = useStorageQueryParams();

    const isNodes = storageType === 'nodes';

    if (isNodes) {
        return (
            <PaginatedStorageNodes
                initialEntitiesCount={props.viewContext.nodeId ? 1 : DEFAULT_ENTITIES_COUNT}
                {...props}
            />
        );
    }

    return (
        <PaginatedStorageGroups
            initialEntitiesCount={props.viewContext.groupId ? 1 : DEFAULT_ENTITIES_COUNT}
            {...props}
        />
    );
};
