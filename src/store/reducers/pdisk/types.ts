import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';

export interface PDiskData extends PreparedPDisk {
    NodeId?: number;
    NodeHost?: string;
    NodeType?: string;
    NodeDC?: string;
    SlotItems?: SlotItem[];
}

export interface SlotItem {
    SlotType: SlotItemType;
    Id?: string | number;
    Title?: string;
    Severity?: number;
    Used?: number;
    Total?: number;
    UsagePercent?: number;

    VDiskData?: PreparedVDisk;
}

export type SlotItemType = 'vDisk' | 'log' | 'empty';
