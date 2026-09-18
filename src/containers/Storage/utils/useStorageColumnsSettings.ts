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
import {useNodesVDisksGroupByParam} from '../useStorageQueryParams';

/**
 * Storage → Nodes → column "PDisks": size coupling notes (keep in sync)
 *
 * Data flow:
 * - `window.api.viewer.getNodes()` returns `MaximumSlotsPerDisk` / `MaximumDisksPerNode`
 *   → `prepareStorageNodesResponse()` maps them into `columnsSettings`
 *   → `handleDataFetched()` retains the largest dimensions observed while the table is mounted
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

export function useStorageColumnsSettings({expertMode = false} = {}) {
    const vDisksGroupBy = useNodesVDisksGroupByParam();
    const isAllVDisksLayout = expertMode && vDisksGroupBy === VDisksGroupBy.All;
    const [layoutData, setLayoutData] = React.useState<StorageDisksLayoutData>();

    const handleDataFetched = React.useCallback((data: StorageNodesPaginatedTableData) => {
        if (!data.columnsSettings) {
            return;
        }

        const nextLayoutData = data.columnsSettings;
        setLayoutData((currentLayoutData) => {
            const maxSlotsPerDisk = Math.max(
                currentLayoutData?.maxSlotsPerDisk ?? 0,
                nextLayoutData.maxSlotsPerDisk,
            );
            const maxDisksPerNode = Math.max(
                currentLayoutData?.maxDisksPerNode ?? 0,
                nextLayoutData.maxDisksPerNode,
            );

            if (
                currentLayoutData?.maxSlotsPerDisk === maxSlotsPerDisk &&
                currentLayoutData.maxDisksPerNode === maxDisksPerNode
            ) {
                return currentLayoutData;
            }

            return {maxSlotsPerDisk, maxDisksPerNode};
        });
    }, []);

    const maxSlotsPerDisk = layoutData?.maxSlotsPerDisk || MAX_SLOTS_DEFAULT;
    const maxDisksPerNode = layoutData?.maxDisksPerNode || MAX_SLOTS_DEFAULT;

    const expertPDiskWidth = isAllVDisksLayout
        ? NODE_EXPERT_ALL_PDISK_WIDTH
        : NODE_EXPERT_PDISK_WIDTH;
    const pDiskWidth = expertMode
        ? expertPDiskWidth
        : Math.max(
              maxSlotsPerDisk * PDISK_VDISK_WIDTH + (maxSlotsPerDisk - 1) * PDISK_GAP_WIDTH,
              NODE_EXPERT_PDISK_WIDTH,
          );
    const pDiskHeight = expertMode
        ? getNodeExpertPDiskHeight(maxSlotsPerDisk, isAllVDisksLayout)
        : STORAGE_NODES_DEFAULT_PDISK_HEIGHT;
    const rowHeight = expertMode
        ? getStorageNodesExpertRowHeight(maxSlotsPerDisk, isAllVDisksLayout)
        : STORAGE_NODES_DEFAULT_ROW_HEIGHT;
    const pDiskContainerWidth = layoutData
        ? maxDisksPerNode * pDiskWidth +
          (maxDisksPerNode - 1) * PDISK_MARGIN +
          2 * PAGINATED_TABLE_CELL_HORIZONTAL_PADDING
        : undefined;

    const columnsSettings: StorageNodesColumnsSettings = React.useMemo(
        () => ({pDiskWidth, pDiskContainerWidth, pDiskHeight, expertMode}),
        [pDiskContainerWidth, pDiskHeight, pDiskWidth, expertMode],
    );

    return {
        handleDataFetched,
        columnsSettings,
        rowHeight,
    };
}
