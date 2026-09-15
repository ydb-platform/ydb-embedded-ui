import React from 'react';

import {VDisksGroupBy} from '../../../utils/disks/groupBy';
import {
    NODE_EXPERT_ALL_PDISK_WIDTH,
    NODE_EXPERT_PDISK_WIDTH,
    STORAGE_NODES_DEFAULT_PDISK_HEIGHT,
    STORAGE_NODES_DEFAULT_ROW_HEIGHT,
    getNodeExpertPDiskHeight,
    getStorageNodesExpertRowHeight,
} from '../PaginatedStorageNodes/nodeExpertModeLayout';
import type {StorageNodesColumnsSettings} from '../PaginatedStorageNodesTable/columns/types';
import type {StorageNodesPaginatedTableData} from '../types';
import {useIsStorageExpertMode, useNodesVDisksGroupByParam} from '../useStorageQueryParams';

/**
 * Storage → Nodes → column "PDisks": size coupling notes (keep in sync)
 *
 * Data flow:
 * - `window.api.viewer.getNodes()` returns `MaximumSlotsPerDisk` / `MaximumDisksPerNode`
 *   → `prepareStorageNodesResponse()` maps them into `columnsSettings`
 *   → `handleDataFetched()` stores the response-wide maxima
 *   → this hook derives the PDisk column width, PDisk content height, and virtualized row height.
 *
 * Default mode keeps VDisks in one row and grows PDisk width when necessary. Expert mode uses
 * rows of 8; VDisk All uses rows of 4 fixed-width disks with size indicators above them.
 * nodeExpertModeLayout owns the dimensions used for both the content and virtualized rows.
 */
const PDISK_VDISK_WIDTH = 8;
const PDISK_GAP_WIDTH = 2;
const PDISK_MARGIN = 10;
const MAX_SLOTS_DEFAULT = 1;
const PAGINATED_TABLE_CELL_HORIZONTAL_PADDING = 10;

interface StorageDisksLayoutData {
    maxSlotsPerDisk: number;
    maxDisksPerNode: number;
}

export function useStorageColumnsSettings() {
    const isStorageExpertMode = useIsStorageExpertMode();
    const vDisksGroupBy = useNodesVDisksGroupByParam();
    const isAllVDisksLayout = isStorageExpertMode && vDisksGroupBy === VDisksGroupBy.All;
    const [layoutData, setLayoutData] = React.useState<StorageDisksLayoutData>();

    const handleDataFetched = React.useCallback((data: StorageNodesPaginatedTableData) => {
        if (!data.columnsSettings) {
            return;
        }

        const nextLayoutData = data.columnsSettings;
        setLayoutData((currentLayoutData) => {
            if (
                currentLayoutData?.maxSlotsPerDisk === nextLayoutData.maxSlotsPerDisk &&
                currentLayoutData.maxDisksPerNode === nextLayoutData.maxDisksPerNode
            ) {
                return currentLayoutData;
            }

            return nextLayoutData;
        });
    }, []);

    const maxSlotsPerDisk = layoutData?.maxSlotsPerDisk || MAX_SLOTS_DEFAULT;
    const maxDisksPerNode = layoutData?.maxDisksPerNode || MAX_SLOTS_DEFAULT;

    const expertPDiskWidth = isAllVDisksLayout
        ? NODE_EXPERT_ALL_PDISK_WIDTH
        : NODE_EXPERT_PDISK_WIDTH;
    const pDiskWidth = isStorageExpertMode
        ? expertPDiskWidth
        : Math.max(
              maxSlotsPerDisk * PDISK_VDISK_WIDTH + (maxSlotsPerDisk - 1) * PDISK_GAP_WIDTH,
              NODE_EXPERT_PDISK_WIDTH,
          );
    const pDiskHeight = isStorageExpertMode
        ? getNodeExpertPDiskHeight(maxSlotsPerDisk, isAllVDisksLayout)
        : STORAGE_NODES_DEFAULT_PDISK_HEIGHT;
    const rowHeight = isStorageExpertMode
        ? getStorageNodesExpertRowHeight(maxSlotsPerDisk, isAllVDisksLayout)
        : STORAGE_NODES_DEFAULT_ROW_HEIGHT;
    const pDiskContainerWidth = layoutData
        ? maxDisksPerNode * pDiskWidth +
          (maxDisksPerNode - 1) * PDISK_MARGIN +
          2 * PAGINATED_TABLE_CELL_HORIZONTAL_PADDING
        : undefined;

    const columnsSettings: StorageNodesColumnsSettings = React.useMemo(
        () => ({pDiskWidth, pDiskContainerWidth, pDiskHeight}),
        [pDiskContainerWidth, pDiskHeight, pDiskWidth],
    );

    return {
        handleDataFetched,
        columnsSettings,
        rowHeight,
    };
}
