import type {TPDiskInfo, TPDiskStateInfo} from '../../types/api/pdisk';
import type {TVDiskStateInfo, TVSlotId} from '../../types/api/vdisk';
import type {ValueOf} from '../../types/common';

import type {PDISK_TYPES} from './getPDiskType';

export type PreparedPDisk = TPDiskStateInfo &
    Omit<Partial<TPDiskInfo>, 'Type'> & {
        Type?: PDiskType;
        Severity?: number;

        AllocatedSize?: number;
        AllocatedPercent?: number;
    };

export interface PreparedVDisk extends TVDiskStateInfo {
    PDisk?: PreparedPDisk;
    Severity?: number;
    StringifiedId?: string;

    TotalSize?: number;
    AllocatedPercent?: number;
}

export type PDiskType = ValueOf<typeof PDISK_TYPES>;

export interface UnavailableDonor extends TVSlotId {
    DonorMode?: boolean;
    StoragePoolName?: string;
}
