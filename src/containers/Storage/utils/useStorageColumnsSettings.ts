import React from 'react';

import type {StorageNodesColumnsSettings} from '../PaginatedStorageNodesTable/columns/types';
import type {StorageNodesPaginatedTableData} from '../types';

const PDISK_VDISK_WIDTH = 3;
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
