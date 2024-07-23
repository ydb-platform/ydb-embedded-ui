import type {TPDiskStateInfo} from '../../types/api/pdisk';
import type {TVDiskStateInfo, TVSlotId} from '../../types/api/vdisk';
import type {ValueOf} from '../../types/common';

import type {PDISK_TYPES} from './getPDiskType';

export interface PreparedPDisk extends TPDiskStateInfo {
    Type?: PDiskType;
    Severity?: number;

    AllocatedSize?: number;
    AllocatedPercent?: number;
}

export interface PreparedVDisk extends TVDiskStateInfo {
    PDisk?: PreparedPDisk;
    Severity?: number;

    TotalSize?: number;
    AllocatedPercent?: number;
}

export type PDiskType = ValueOf<typeof PDISK_TYPES>;

export interface UnavailableDonor extends TVSlotId {
    DonorMode?: boolean;
    StoragePoolName?: string;
}
