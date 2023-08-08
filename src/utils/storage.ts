import type {PreparedStorageGroup} from '../store/reducers/storage/types';
import type {TVSlotId, TVDiskStateInfo} from '../types/api/vdisk';

export const isFullVDiskData = (disk: TVDiskStateInfo | TVSlotId): disk is TVDiskStateInfo =>
    'VDiskId' in disk;

export const getUsage = (data: PreparedStorageGroup, step = 1) => {
    // if limit is 0, display 0
    const usage = Math.round((data.Used * 100) / data.Limit) || 0;

    return Math.floor(usage / step) * step;
};
