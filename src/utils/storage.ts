import type {TVSlotId, TVDiskStateInfo} from '../types/api/vdisk';
import type {IStoragePoolGroup} from '../types/store/storage';

export const isFullVDiskData = (disk: TVDiskStateInfo | TVSlotId): disk is TVDiskStateInfo =>
    'VDiskId' in disk;

export const getUsage = (data: IStoragePoolGroup, step = 1) => {
    // if limit is 0, display 0
    const usage = Math.round((data.Used * 100) / data.Limit) || 0;

    return Math.floor(usage / step) * step;
};
