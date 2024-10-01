import {PaginatedStorageGroups} from './PaginatedStorageGroups';
import {PaginatedStorageNodes} from './PaginatedStorageNodes';
import {useStorageQueryParams} from './useStorageQueryParams';

export interface PaginatedStorageProps {
    database?: string;
    nodeId?: string | number;
    groupId?: string | number;
    pDiskId?: string | number;

    parentContainer?: Element | null;
}

export const PaginatedStorage = (props: PaginatedStorageProps) => {
    const {storageType} = useStorageQueryParams();

    const isNodes = storageType === 'nodes';

    if (isNodes) {
        return <PaginatedStorageNodes {...props} />;
    }

    return <PaginatedStorageGroups {...props} />;
};
