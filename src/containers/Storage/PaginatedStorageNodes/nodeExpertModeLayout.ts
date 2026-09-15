import type {PreparedVDisk} from '../../../utils/disks/types';

export const NODE_EXPERT_PDISK_WIDTH = 165;
export const NODE_EXPERT_VDISKS_PER_ROW = 8;
export const NODE_EXPERT_ALL_VDISKS_PER_ROW = 4;
export const NODE_EXPERT_ALL_VDISK_WIDTH = 45;

const NODE_EXPERT_VDISK_MIN_WIDTH = 10;
const NODE_EXPERT_VDISK_GAP = 2;
const NODE_EXPERT_VDISK_HEIGHT = 14;
const NODE_EXPERT_VDISK_ROW_GAP = 2;
const NODE_EXPERT_VDISK_PDISK_GAP = 6;
const NODE_EXPERT_VDISK_SIZE_INDICATOR_HEIGHT = 2;
const NODE_EXPERT_VDISK_SIZE_INDICATOR_GAP = 2;
const PDISK_HEIGHT = 20;
const TABLE_CELL_VERTICAL_PADDING = 10;
const TABLE_ROW_BORDER = 1;

export const STORAGE_NODES_DEFAULT_ROW_HEIGHT = 51;
export const STORAGE_NODES_DEFAULT_PDISK_HEIGHT = 40;
export const NODE_EXPERT_ALL_PDISK_WIDTH =
    NODE_EXPERT_ALL_VDISKS_PER_ROW * NODE_EXPERT_ALL_VDISK_WIDTH +
    (NODE_EXPERT_ALL_VDISKS_PER_ROW - 1) * NODE_EXPERT_VDISK_GAP;

export interface NodeExpertVDiskLayoutItem {
    vDisk: PreparedVDisk;
    width: number;
}

function getVDiskWeight(vDisk: PreparedVDisk) {
    const allocatedSize = Number(vDisk.AllocatedSize);

    return Number.isFinite(allocatedSize) && allocatedSize > 0 ? allocatedSize : 1;
}

export function calculateNodeExpertVDiskRows(
    vDisks: PreparedVDisk[],
    pDiskWidth = NODE_EXPERT_PDISK_WIDTH,
): NodeExpertVDiskLayoutItem[][] {
    const rows: PreparedVDisk[][] = [];

    for (let index = 0; index < vDisks.length; index += NODE_EXPERT_VDISKS_PER_ROW) {
        rows.push(vDisks.slice(index, index + NODE_EXPERT_VDISKS_PER_ROW));
    }

    if (rows.length === 0) {
        return [];
    }

    // The densest row constrains one shared scale so VDisk widths stay comparable across rows.
    const scale = Math.min(
        ...rows.map((row) => {
            const gapsWidth = NODE_EXPERT_VDISK_GAP * Math.max(row.length - 1, 0);
            const minimumItemsWidth = NODE_EXPERT_VDISK_MIN_WIDTH * row.length;
            const availableGrowth = Math.max(pDiskWidth - gapsWidth - minimumItemsWidth, 0);
            const totalWeight = row.reduce((sum, vDisk) => sum + getVDiskWeight(vDisk), 0);

            return availableGrowth / totalWeight;
        }),
    );

    return rows.map((row) =>
        row.map((vDisk) => ({
            vDisk,
            width: NODE_EXPERT_VDISK_MIN_WIDTH + getVDiskWeight(vDisk) * scale,
        })),
    );
}

export function getNodeExpertVDiskRowsCount(maximumSlotsPerDisk: number, isAllMode = false) {
    const slotsCount =
        Number.isFinite(maximumSlotsPerDisk) && maximumSlotsPerDisk > 0
            ? Math.ceil(maximumSlotsPerDisk)
            : 1;

    const disksPerRow = isAllMode ? NODE_EXPERT_ALL_VDISKS_PER_ROW : NODE_EXPERT_VDISKS_PER_ROW;

    return Math.max(1, Math.ceil(slotsCount / disksPerRow));
}

export function getNodeExpertPDiskHeight(maximumSlotsPerDisk: number, isAllMode = false) {
    const rowsCount = getNodeExpertVDiskRowsCount(maximumSlotsPerDisk, isAllMode);
    const vDiskHeight = isAllMode
        ? NODE_EXPERT_VDISK_HEIGHT +
          NODE_EXPERT_VDISK_SIZE_INDICATOR_HEIGHT +
          NODE_EXPERT_VDISK_SIZE_INDICATOR_GAP
        : NODE_EXPERT_VDISK_HEIGHT;

    return (
        rowsCount * vDiskHeight +
        (rowsCount - 1) * NODE_EXPERT_VDISK_ROW_GAP +
        NODE_EXPERT_VDISK_PDISK_GAP +
        PDISK_HEIGHT
    );
}

export function getStorageNodesExpertRowHeight(maximumSlotsPerDisk: number, isAllMode = false) {
    return (
        getNodeExpertPDiskHeight(maximumSlotsPerDisk, isAllMode) +
        TABLE_CELL_VERTICAL_PADDING +
        TABLE_ROW_BORDER
    );
}
