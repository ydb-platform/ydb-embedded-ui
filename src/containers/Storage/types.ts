import type {PaginatedTableData} from '../../components/PaginatedTable';
import type {PreparedStorageNode} from '../../store/reducers/storage/types';

export type StorageViewContext = {
    groupId?: string;
    nodeId?: string;
    pDiskId?: string;
    vDiskSlotId?: string;
};

export type StorageNodesPaginatedTableData = PaginatedTableData<PreparedStorageNode> & {
    columnSettings?: {
        maxSlotsPerDisk: number;
        maxDisksPerNode: number;
    };
};
