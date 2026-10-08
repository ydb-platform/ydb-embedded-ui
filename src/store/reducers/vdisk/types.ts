import type {PreparedVDisk} from '../../../utils/disks/types';

export interface VDiskData extends PreparedVDisk {
    Recipient?: PreparedVDisk;

    NodeId?: number;
    NodeHost?: string;
    NodeDC?: string;
    NodeRack?: string;

    PDiskId?: number;
    PDiskType?: string;
}
