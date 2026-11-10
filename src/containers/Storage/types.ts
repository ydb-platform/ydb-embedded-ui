import type {PreparedStorageNode} from '../../store/reducers/storage/types';
import type {TableDataWithQuality} from '../../utils/dataIssues/types';

export type StorageViewContext = {
    groupId?: string;
    nodeId?: string;
    pDiskId?: string;
    vDiskSlotId?: string;
};

export type StorageNodesPaginatedTableData = TableDataWithQuality<PreparedStorageNode> & {
    columnsSettings?: {
        maxSlotsPerDisk: number;
        maxDisksPerNode: number;
    };
};
