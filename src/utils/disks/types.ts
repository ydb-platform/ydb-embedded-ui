import type {TPDiskStateInfo} from '../../types/api/pdisk';
import type {TVDiskStateInfo} from '../../types/api/vdisk';
import type {ValueOf} from '../../types/common';
import type {PDISK_TYPES} from './getPDiskType';

export interface PreparedPDisk extends TPDiskStateInfo {
    Type?: PDiskType;
    AllocatedPercent?: number;
    Severity?: number;
}

export interface PreparedVDisk extends TVDiskStateInfo {
    PDisk?: PreparedPDisk;
    AllocatedPercent?: number;
    Severity?: number;
}

export type PDiskType = ValueOf<typeof PDISK_TYPES>;
