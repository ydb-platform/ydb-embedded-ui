import React from 'react';

import type {StorageNodesColumnsSettings} from '../PaginatedStorageNodesTable/columns/types';
import type {StorageNodesPaginatedTableData} from '../types';

/**
 * Storage → Nodes → column "PDisks": size coupling notes (keep in sync)
 *
 * Data flow:
 * - `window.api.viewer.getNodes()` returns `MaximumSlotsPerDisk` / `MaximumDisksPerNode`
 *   → `prepareStorageNodesResponse()` maps them into `columnsSettings.{maxSlotsPerDisk,maxDisksPerNode}`
 *     (`src/store/reducers/storage/utils.ts`)
 *   → `handleDataFetched()` calculates `pDiskWidth` and `pDiskContainerWidth` (this file)
 *   → `PaginatedStorageNodesTable` column width uses `pDiskContainerWidth`
 *     and each `PDisk` instance gets `width={pDiskWidth}`.
 *
 * Visual model:
 * - One PDisk cell renders a horizontal row of compact VDisks above the PDisk progress bar
 *   (`src/containers/Storage/PDisk/PDisk.tsx`).
 * - Each VDisk "slot" has a hard minimum width and a gap between slots:
 *   - slot min-width is effectively 8px:
 *     - `--pdisk-vdisk-width: 8px` (`src/containers/Storage/PDisk/PDisk.scss`)
 *     - `DiskStateProgressBar` compact min-width is 8px
 *       (`src/components/DiskStateProgressBar/DiskStateProgressBar.scss`)
 *   - gap is 2px: `--pdisk-gap-width: 2px` (`src/containers/Storage/PDisk/PDisk.scss`)
 *
 * Therefore, the `pDiskWidth` formula below MUST use the same slot/gap values,
 * otherwise with large `maxSlotsPerDisk` the VDisks row will overflow the PDisk width.
 */
const PDISK_VDISK_WIDTH = 8;
const PDISK_GAP_WIDTH = 2;
const PDISK_MIN_WIDTH = 165;
const PDISK_MARGIN = 10;
const MAX_SLOTS_DEFAULT = 1;
const PAGNATED_TABLE_CELL_HORIZONTAL_PADDING = 10;

export function useStorageColumnsSettings() {
    const [pDiskWidth, setPDiskWidth] = React.useState<number | undefined>(undefined);
    const [pDiskContainerWidth, setPDiskContainerWidth] = React.useState<number | undefined>(
        undefined,
    );

    const handleDataFetched = React.useCallback(
        (data: StorageNodesPaginatedTableData) => {
            if (data?.columnsSettings && !pDiskWidth) {
                const {maxSlotsPerDisk, maxDisksPerNode} = data.columnsSettings;
                const maxSlots = maxSlotsPerDisk || MAX_SLOTS_DEFAULT;
                const maxDisks = maxDisksPerNode || MAX_SLOTS_DEFAULT;

                const calculatedPDiskWidth = Math.max(
                    maxSlots * PDISK_VDISK_WIDTH + (maxSlots - 1) * PDISK_GAP_WIDTH,
                    PDISK_MIN_WIDTH,
                );

                const calculatedPDiskContainerWidth =
                    maxDisks * calculatedPDiskWidth +
                    (maxDisks - 1) * PDISK_MARGIN +
                    2 * PAGNATED_TABLE_CELL_HORIZONTAL_PADDING;

                setPDiskWidth(calculatedPDiskWidth);
                setPDiskContainerWidth(calculatedPDiskContainerWidth);
            }
        },
        [pDiskWidth],
    );

    const columnsSettings: StorageNodesColumnsSettings = React.useMemo(() => {
        return {
            pDiskWidth: pDiskWidth || PDISK_MIN_WIDTH,
            pDiskContainerWidth: pDiskContainerWidth,
        };
    }, [pDiskContainerWidth, pDiskWidth]);

    return {
        handleDataFetched,
        columnsSettings,
    };
}
