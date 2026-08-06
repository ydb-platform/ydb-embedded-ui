import type {PreparedVDisk} from '../../../utils/disks/types';
import {isNumeric} from '../../../utils/utils';

import {
    COMPACT_VDISK_FLEX_BASIS,
    COMPACT_VDISK_MIN_WIDTH,
    VDISKS_CONTAINER_WIDTH,
} from './constants';

export function calculateCompactVDiskWidths(vDisks: PreparedVDisk[], gapWidth: number): number[] {
    if (vDisks.length === 0) {
        return [];
    }

    const availableWidth = VDISKS_CONTAINER_WIDTH - gapWidth * (vDisks.length - 1);
    const averageWidth = availableWidth / vDisks.length;
    const items = vDisks.map((vDisk, index) => {
        const hasAllocatedSize = isNumeric(vDisk.AllocatedSize);
        const allocatedSize = Number(vDisk.AllocatedSize);

        return {
            index,
            grow: allocatedSize > 0 ? allocatedSize : 1,
            minWidth: hasAllocatedSize ? COMPACT_VDISK_MIN_WIDTH : averageWidth,
        };
    });

    const widths = vDisks.map(() => 0);
    let remainingItems = items;
    let remainingWidth = availableWidth;

    while (remainingItems.length > 0) {
        const growSum = remainingItems.reduce((sum, item) => sum + item.grow, 0);
        const distributableWidth =
            remainingWidth - COMPACT_VDISK_FLEX_BASIS * remainingItems.length;
        const calculateWidth = (grow: number) =>
            COMPACT_VDISK_FLEX_BASIS + (distributableWidth * grow) / growSum;
        const nextItems: typeof items = [];
        let frozenWidth = 0;

        remainingItems.forEach((item) => {
            const width = calculateWidth(item.grow);

            if (width < item.minWidth) {
                widths[item.index] = item.minWidth;
                frozenWidth += item.minWidth;
            } else {
                widths[item.index] = width;
                nextItems.push(item);
            }
        });

        if (nextItems.length === remainingItems.length) {
            break;
        }

        remainingWidth -= frozenWidth;
        remainingItems = nextItems;
    }

    return widths;
}
