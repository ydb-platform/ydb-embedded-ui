import React from 'react';

import {SETTING_KEYS} from '../../../store/reducers/settings/constants';
import {useSetting} from '../../../utils/hooks/useSetting';
import {getPDisksPreviewColumnWidth} from '../PDisks/PDisksPreview';
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
    const [pDisksPreviewEnabled] = useSetting<boolean>(SETTING_KEYS.ENABLE_PDISKS_PREVIEW);
    const [widths, setWidths] = React.useState<{
        selectionKey?: string;
        maxima?: StorageNodesPaginatedTableData['columnsSettings'];
        previewColumnWidth: number;
    }>({previewColumnWidth: 0});
    const {maxima, previewColumnWidth} = widths;

    const handleDataFetched = React.useCallback((data: StorageNodesPaginatedTableData) => {
        if (!data) {
            return;
        }
        const fetchedPreviewWidth = data.data.reduce(
            (width, node) => Math.max(width, getPDisksPreviewColumnWidth(node)),
            0,
        );
        setWidths((previous) => {
            // Retain maxima across chunks of one selection, including its grouped tables.
            // Use the response's key so a callback rerender cannot relabel cached old data.
            const sameSelection = previous.selectionKey === data.selectionKey;
            const previousMaxima = sameSelection ? previous.maxima : undefined;
            const previewWidth = Math.max(
                sameSelection ? previous.previewColumnWidth : 0,
                fetchedPreviewWidth,
            );
            const nextMaxima = data.columnsSettings
                ? {
                      maxSlotsPerDisk: Math.max(
                          previousMaxima?.maxSlotsPerDisk || 1,
                          data.columnsSettings.maxSlotsPerDisk || 1,
                      ),
                      maxDisksPerNode: Math.max(
                          previousMaxima?.maxDisksPerNode || 1,
                          data.columnsSettings.maxDisksPerNode || 1,
                      ),
                  }
                : previousMaxima;
            if (
                sameSelection &&
                previous.previewColumnWidth === previewWidth &&
                previous.maxima?.maxSlotsPerDisk === nextMaxima?.maxSlotsPerDisk &&
                previous.maxima?.maxDisksPerNode === nextMaxima?.maxDisksPerNode
            ) {
                return previous;
            }
            return {
                selectionKey: data.selectionKey,
                maxima: nextMaxima,
                previewColumnWidth: previewWidth,
            };
        });
    }, []);

    const columnsSettings: StorageNodesColumnsSettings = React.useMemo(() => {
        const maxSlots = maxima?.maxSlotsPerDisk || MAX_SLOTS_DEFAULT;
        const maxDisks = maxima?.maxDisksPerNode || MAX_SLOTS_DEFAULT;
        const pDiskWidth = Math.max(
            maxSlots * PDISK_VDISK_WIDTH + (maxSlots - 1) * PDISK_GAP_WIDTH,
            PDISK_MIN_WIDTH,
        );
        const pDiskContainerWidth = maxima
            ? maxDisks * pDiskWidth +
              (maxDisks - 1) * PDISK_MARGIN +
              2 * PAGNATED_TABLE_CELL_HORIZONTAL_PADDING
            : undefined;
        return {
            pDiskWidth,
            pDiskContainerWidth: pDisksPreviewEnabled
                ? previewColumnWidth || undefined
                : pDiskContainerWidth,
            pDisksPreviewEnabled,
        };
    }, [maxima, pDisksPreviewEnabled, previewColumnWidth]);

    return {
        handleDataFetched,
        columnsSettings,
    };
}
