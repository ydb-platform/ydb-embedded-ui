import type {PreparedVDisk} from '../../../utils/disks/types';
import type {PreparedStorageGroup} from '../storage/types';

export type VDiskGroup = Partial<PreparedStorageGroup>;

export interface VDiskData extends PreparedVDisk {
    NodeId?: number;
    NodeHost?: string;
    NodeType?: string;
    NodeDC?: string;

    PDiskId?: number;
    PDiskType?: string;
}
