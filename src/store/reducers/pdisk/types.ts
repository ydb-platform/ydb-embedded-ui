import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';

export interface PDiskData extends PreparedPDisk {
    NodeId?: number;
    NodeHost?: string;
    NodeType?: string;
    NodeDC?: string;
    SlotItems?: (SlotItem<'vDisk'> | SlotItem<'log'> | SlotItem<'empty'>)[];
}

export interface SlotItem<T extends SlotItemType> {
    SlotType: T;
    Id?: string | number;
    Title?: string;
    Severity?: number;
    Used?: number;
    Total?: number;
    UsagePercent?: number;

    SlotData: T extends 'vDisk'
        ? PreparedVDisk
        : T extends 'log'
          ? LogSlotData
          : T extends 'empty'
            ? EmptySlotData
            : undefined;
}

export type LogSlotData = Pick<PDiskData, 'LogUsedSize' | 'LogTotalSize' | 'SystemSize'>;

export type EmptySlotData = {
    Size: number;
};

export type SlotItemType = 'vDisk' | 'log' | 'empty';
