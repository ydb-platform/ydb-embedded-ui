import React from 'react';

import {chunk} from 'lodash';

import {VDisk} from '../../../components/VDisk/VDisk';
import {cn} from '../../../utils/cn';
import type {VDiskDisplayStateGetter} from '../../../utils/disks/displayState';
import type {PreparedVDisk} from '../../../utils/disks/types';
import {
    NODE_EXPERT_ALL_VDISKS_PER_ROW,
    NODE_EXPERT_ALL_VDISK_WIDTH,
    calculateNodeExpertVDiskRows,
} from '../PaginatedStorageNodes/nodeExpertModeLayout';
import {DISKS_POPUP_DEBOUNCE_TIMEOUT} from '../shared';
import type {StorageViewContext} from '../types';
import {isVdiskActive} from '../utils';

import type {PDiskProps} from './PDisk';
import {PDisk} from './PDisk';

const b = cn('pdisk-storage');
const NODE_EXPERT_VDISK_ICON_SIZE = 10;
const NODE_EXPERT_VDISK_ICON_GROUP_SIZE = 8;

interface PDiskWithVDisksProps extends Omit<PDiskProps, 'topContent'> {
    vDisks?: PreparedVDisk[];
    viewContext?: StorageViewContext;
    withVDiskIcons?: boolean;
    getVDiskDisplayState?: VDiskDisplayStateGetter;
    expertMode?: boolean;
    isAllVDisksLayout?: boolean;
    highlightedDisk?: string;
    setHighlightedDisk?: (id?: string) => void;
}

interface VDiskItemProps {
    vDisk: PreparedVDisk;
    vDiskWidth?: number;
    viewContext?: StorageViewContext;
    withIcon?: boolean;
    getVDiskDisplayState?: VDiskDisplayStateGetter;
    expertMode?: boolean;
    isAllVDisksLayout?: boolean;
    delayOpen: number;
    delayClose: number;
    highlighted: boolean;
    setHighlightedDisk?: (id?: string) => void;
}

const VDiskItem = React.memo(function VDiskItem({
    vDisk,
    vDiskWidth,
    viewContext,
    withIcon,
    getVDiskDisplayState,
    expertMode,
    isAllVDisksLayout,
    delayOpen,
    delayClose,
    highlighted,
    setHighlightedDisk,
}: VDiskItemProps) {
    const id = vDisk.StringifiedId;
    const onShowPopup = React.useCallback(() => setHighlightedDisk?.(id), [id, setHighlightedDisk]);
    const onHidePopup = React.useCallback(
        () => setHighlightedDisk?.(undefined),
        [setHighlightedDisk],
    );
    const diskWidth = isAllVDisksLayout ? NODE_EXPERT_ALL_VDISK_WIDTH : vDiskWidth;

    return (
        <div
            className={b('vdisks-item', {all: isAllVDisksLayout})}
            style={
                expertMode
                    ? {width: diskWidth, flexBasis: diskWidth}
                    : {
                          // 1 is small enough for empty disks to be of the minimum width
                          // but if all of them are empty, `flex-grow: 1` would size them evenly
                          flexGrow: Number(vDisk.AllocatedSize) || 1,
                      }
            }
        >
            {isAllVDisksLayout ? (
                <div
                    aria-hidden
                    className={b('vdisk-size-indicator')}
                    style={{width: vDiskWidth}}
                />
            ) : null}
            <VDisk
                withIcon={withIcon}
                data={vDisk}
                inactive={!isVdiskActive(vDisk, viewContext)}
                compact={!isAllVDisksLayout}
                allModeSize={isAllVDisksLayout ? 's' : undefined}
                delayOpen={delayOpen}
                delayClose={delayClose}
                showPopup={highlighted}
                onShowPopup={onShowPopup}
                onHidePopup={onHidePopup}
                highlighted={highlighted}
                getDisplayState={getVDiskDisplayState}
                iconSize={expertMode ? NODE_EXPERT_VDISK_ICON_SIZE : undefined}
                iconGroupSize={expertMode ? NODE_EXPERT_VDISK_ICON_GROUP_SIZE : undefined}
                indicatorClassName={expertMode ? b('vdisk-indicator') : undefined}
                progressBarClassName={
                    expertMode
                        ? b('vdisk-progress-bar', {
                              expert: true,
                              all: isAllVDisksLayout,
                          })
                        : undefined
                }
            />
        </div>
    );
});

export const PDiskWithVDisks = React.memo(function PDiskWithVDisks({
    vDisks,
    viewContext,
    withIcon,
    withVDiskIcons,
    getVDiskDisplayState,
    expertMode,
    isAllVDisksLayout,
    width,
    delayOpen = DISKS_POPUP_DEBOUNCE_TIMEOUT,
    delayClose = DISKS_POPUP_DEBOUNCE_TIMEOUT,
    highlightedDisk,
    setHighlightedDisk,
    ...pDiskProps
}: PDiskWithVDisksProps) {
    const vDiskRows = React.useMemo(() => {
        const compactVDiskRows = expertMode
            ? calculateNodeExpertVDiskRows(vDisks ?? [], width)
            : [(vDisks ?? []).map((vDisk) => ({vDisk, width: undefined}))];

        // All-mode size markers use the compact allocation scale; only the fixed-width cards
        // are regrouped into rows of four.
        return isAllVDisksLayout
            ? chunk(compactVDiskRows.flat(), NODE_EXPERT_ALL_VDISKS_PER_ROW)
            : compactVDiskRows;
    }, [expertMode, isAllVDisksLayout, vDisks, width]);
    const vDisksContent = vDisks?.length ? (
        <div className={b('vdisks', {expert: expertMode})}>
            {vDiskRows.map((row, rowIndex) => (
                <div key={row[0]?.vDisk.StringifiedId ?? rowIndex} className={b('vdisks-row')}>
                    {row.map(({vDisk, width: vDiskWidth}) => (
                        <VDiskItem
                            key={vDisk.StringifiedId}
                            vDisk={vDisk}
                            vDiskWidth={vDiskWidth}
                            viewContext={viewContext}
                            withIcon={withVDiskIcons ?? withIcon}
                            getVDiskDisplayState={getVDiskDisplayState}
                            expertMode={expertMode}
                            isAllVDisksLayout={isAllVDisksLayout}
                            delayOpen={delayOpen}
                            delayClose={delayClose}
                            highlighted={highlightedDisk === vDisk.StringifiedId}
                            setHighlightedDisk={setHighlightedDisk}
                        />
                    ))}
                </div>
            ))}
        </div>
    ) : null;

    return (
        <PDisk
            {...pDiskProps}
            width={width}
            withIcon={withIcon}
            delayOpen={delayOpen}
            delayClose={delayClose}
            topContent={vDisksContent}
        />
    );
});
