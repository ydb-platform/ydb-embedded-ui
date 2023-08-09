import type {TVSlotId, TVDiskStateInfo} from '../types/api/vdisk';

export const isFullVDiskData = (disk: TVDiskStateInfo | TVSlotId): disk is TVDiskStateInfo =>
    'VDiskId' in disk;

interface EntityWithUsage {
    Used: number;
    Limit: number;
}

export const getUsage = <T extends EntityWithUsage>(data: T, step = 1) => {
    // if limit is 0, display 0
    const usage = data.Limit ? (data.Used * 100) / data.Limit : 0;

    return Math.floor(usage / step) * step;
};
