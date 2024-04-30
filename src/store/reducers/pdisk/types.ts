import type {PreparedPDisk} from '../../../utils/disks/types';

export interface PDiskData extends PreparedPDisk {
    NodeId?: number;
    NodeHost?: string;
    NodeType?: string;
    NodeDC?: string;
}
