import type {TVDiskStateInfo, TVSlotId} from '../../types/api/vdisk';

export function isFullVDiskData(disk: TVDiskStateInfo | TVSlotId): disk is TVDiskStateInfo {
    return 'VDiskId' in disk;
}
