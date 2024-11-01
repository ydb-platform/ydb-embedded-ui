import type {TPDiskInfo, TPDiskStateInfo} from '../../types/api/pdisk';
import type {TVDiskStateInfo, TVSlotId} from '../../types/api/vdisk';
import type {ValueOf} from '../../types/common';

import type {PDISK_TYPES} from './getPDiskType';

export type PreparedPDisk = Omit<
    TPDiskStateInfo,
    'AvailableSize' | 'TotalSize' | 'EnforcedDynamicSlotSize'
> &
    Omit<Partial<TPDiskInfo>, 'Type' | 'AvailableSize' | 'TotalSize'> & {
        Type?: PDiskType;
        Severity?: number;
        StringifiedId?: string;

        AvailableSize?: number;
        TotalSize?: number;
        AllocatedSize?: number;
        AllocatedPercent?: number;

        SlotSize?: string;
    };

export interface PreparedVDisk
    extends Omit<TVDiskStateInfo, 'PDisk' | 'AvailableSize' | 'AllocatedSize' | 'Donors'> {
    PDisk?: PreparedPDisk;
    Severity?: number;
    StringifiedId?: string;

    AvailableSize?: number;
    TotalSize?: number;
    AllocatedSize?: number;
    AllocatedPercent?: number;

    Donors?: PreparedVDisk[];
}

export type PDiskType = ValueOf<typeof PDISK_TYPES>;

export interface UnavailableDonor extends TVSlotId {
    DonorMode?: boolean;
    StoragePoolName?: string;
}
