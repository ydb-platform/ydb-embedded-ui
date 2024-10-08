import {USE_PAGINATED_TABLES_KEY} from '../../utils/constants';
import {useSetting} from '../../utils/hooks';

import {PaginatedStorage} from './PaginatedStorage';
import {Storage} from './Storage';
import type {StorageViewContext} from './types';

interface StorageWrapperProps {
    database?: string;
    nodeId?: string | number;
    pDiskId?: string | number;
    groupId?: string | number;
    vDiskSlotId?: string | number;
    parentRef?: React.RefObject<HTMLElement> | null;
}

export const StorageWrapper = ({parentRef, ...props}: StorageWrapperProps) => {
    const [usePaginatedTables] = useSetting<boolean>(USE_PAGINATED_TABLES_KEY);

    const viewContext: StorageViewContext = {
        nodeId: props.nodeId?.toString(),
        pDiskId: props.pDiskId?.toString(),
        groupId: props.groupId?.toString(),
        vDiskSlotId: props.vDiskSlotId?.toString(),
    };

    if (usePaginatedTables) {
        return <PaginatedStorage parentRef={parentRef} viewContext={viewContext} {...props} />;
    }

    return <Storage viewContext={viewContext} {...props} />;
};
