import {uiFactory} from '../../../uiFactory/uiFactory';

export const VDISKS_CONTAINER_WIDTH = 316;
export const ALL_VDISK_WIDTH = 65;
const ALL_VDISK_GAP_WIDTH = 4;
export const EXPERT_MODE_PDISK_WIDTH = 55;
export const EXPERT_MODE_ALL_PDISK_WIDTH = 98;

export const COMPACT_VDISK_FLEX_BASIS = 8;
export const COMPACT_VDISK_MIN_WIDTH = 24;

export function getAllVDisksContainerWidth(): number {
    const disksCount = uiFactory.maxVDisksInStorageGroup;

    return disksCount * ALL_VDISK_WIDTH + (disksCount - 1) * ALL_VDISK_GAP_WIDTH;
}

export function getAllPDisksContainerWidthExpansion(): number {
    return (
        uiFactory.maxVDisksInStorageGroup * (EXPERT_MODE_ALL_PDISK_WIDTH - EXPERT_MODE_PDISK_WIDTH)
    );
}
