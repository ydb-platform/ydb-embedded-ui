import type {PreparedVDisk} from '../../../utils/disks/types';

export interface VDiskData extends PreparedVDisk {
    NodeId?: number;
    NodeHost?: string;
    NodeType?: string;
    NodeDC?: string;

    PDiskId?: number;
    PDiskType?: string;
}
