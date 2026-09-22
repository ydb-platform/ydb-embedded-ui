import React from 'react';

import {isNil} from 'lodash';

import {cn} from '../../../utils/cn';
import type {
    PDiskDisplayStateGetter,
    VDiskDisplayStateGetter,
} from '../../../utils/disks/displayState';
import {VDisksGroupBy} from '../../../utils/disks/groupBy';
import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import {PDiskWithVDisks} from '../PDisk/';
import type {StorageViewContext} from '../types';
import {useStorageNodesPDiskDisplayStateGetter} from '../useStoragePDiskDisplayStateGetter';
import {useNodesVDisksGroupByParam} from '../useStorageQueryParams';
import {useStorageNodesVDiskDisplayStateGetter} from '../useStorageVDiskDisplayStateGetter';
import {isPdiskActive} from '../utils';
import {useVirtualizedDiskList} from '../utils/useVirtualizedDiskList';

import './PDisks.scss';

const b = cn('ydb-storage-pdisks');
const EMPTY_VDISKS: PreparedVDisk[] = [];

interface PDisksProps {
    pDisks?: PreparedPDisk[];
    vDisks?: PreparedVDisk[];
    viewContext?: StorageViewContext;
    pDiskWidth?: number;
    pDiskHeight?: number;
    expertMode?: boolean;
}

interface PDiskItemProps {
    pDisk: PreparedPDisk;
    vDisks?: PreparedVDisk[];
    viewContext?: StorageViewContext;
    pDiskWidth?: number;
    expertMode: boolean;
    isAllVDisksLayout: boolean;
    getPDiskDisplayState?: PDiskDisplayStateGetter;
    getVDiskDisplayState?: VDiskDisplayStateGetter;
    highlighted: boolean;
    highlightedDisk?: string;
    setHighlightedDisk: (id?: string) => void;
}

const PDiskItem = React.memo(function PDiskItem({
    pDisk,
    vDisks,
    viewContext,
    pDiskWidth,
    expertMode,
    isAllVDisksLayout,
    getPDiskDisplayState,
    getVDiskDisplayState,
    highlighted,
    highlightedDisk,
    setHighlightedDisk,
}: PDiskItemProps) {
    const id = pDisk.StringifiedId;
    const onShowPopup = React.useCallback(() => setHighlightedDisk(id), [id, setHighlightedDisk]);
    const onHidePopup = React.useCallback(
        () => setHighlightedDisk(undefined),
        [setHighlightedDisk],
    );

    return (
        <PDiskWithVDisks
            data={pDisk}
            inactive={!isPdiskActive(pDisk, viewContext)}
            vDisks={vDisks}
            viewContext={viewContext}
            width={pDiskWidth}
            withIcon={expertMode}
            withVDiskIcons={expertMode}
            getVDiskDisplayState={getVDiskDisplayState}
            expertMode={expertMode}
            isAllVDisksLayout={isAllVDisksLayout}
            showTypeLabel={expertMode}
            getDisplayState={getPDiskDisplayState}
            showPopup={highlighted}
            onShowPopup={onShowPopup}
            onHidePopup={onHidePopup}
            highlighted={highlighted}
            highlightedDisk={highlightedDisk}
            setHighlightedDisk={setHighlightedDisk}
        />
    );
});

export const PDisks = React.memo(function PDisks({
    pDisks = [],
    vDisks = EMPTY_VDISKS,
    viewContext,
    pDiskWidth,
    pDiskHeight,
    expertMode = false,
}: PDisksProps) {
    const [highlightedDisk, setHighlightedDisk] = React.useState<string | undefined>();
    const {containerRef, shouldRenderDisk, getPlaceholderProps} = useVirtualizedDiskList(
        pDisks,
        pDisks.every((disk) => !isNil(disk.NodeId) && !isNil(disk.PDiskId)),
    );
    const vDisksGroupBy = useNodesVDisksGroupByParam();
    const isAllVDisksLayout = expertMode && vDisksGroupBy === VDisksGroupBy.All;
    const getStoragePDiskDisplayState = useStorageNodesPDiskDisplayStateGetter();
    const getStorageVDiskDisplayState = useStorageNodesVDiskDisplayStateGetter();
    const vDisksByPDisk = React.useMemo(() => {
        const disks = new Map<PreparedVDisk['PDiskId'], PreparedVDisk[]>();
        for (const vDisk of vDisks) {
            const relatedDisks = disks.get(vDisk.PDiskId);
            if (relatedDisks) {
                relatedDisks.push(vDisk);
            } else {
                disks.set(vDisk.PDiskId, [vDisk]);
            }
        }
        return disks;
    }, [vDisks]);

    React.useEffect(() => {
        setHighlightedDisk((id) =>
            pDisks.some((disk) => disk.StringifiedId === id) ||
            vDisks.some((disk) => disk.StringifiedId === id)
                ? id
                : undefined,
        );
    }, [pDisks, vDisks]);

    if (!pDisks.length) {
        return null;
    }

    return (
        <div className={b('pdisks-wrapper')} ref={containerRef} style={{height: pDiskHeight}}>
            {pDisks.map((pDisk, index) => {
                const id = pDisk.StringifiedId;
                const highlighted = id !== undefined && highlightedDisk === id;
                const relatedVDisks = vDisksByPDisk.get(pDisk.PDiskId);
                // Keep the popup anchor mounted until interaction and delayed close finish.
                const hasOpenPopup =
                    highlighted ||
                    Boolean(
                        highlightedDisk &&
                            relatedVDisks?.some((vDisk) => vDisk.StringifiedId === highlightedDisk),
                    );

                return (
                    // Keep the full row geometry while offscreen disks are unmounted.
                    <div
                        className={b('pdisks-item')}
                        key={id || index}
                        style={{width: pDiskWidth}}
                        {...(hasOpenPopup ? undefined : getPlaceholderProps(index))}
                    >
                        {(shouldRenderDisk(index) || hasOpenPopup) && (
                            <PDiskItem
                                pDisk={pDisk}
                                vDisks={relatedVDisks}
                                viewContext={viewContext}
                                pDiskWidth={pDiskWidth}
                                expertMode={expertMode}
                                isAllVDisksLayout={isAllVDisksLayout}
                                getPDiskDisplayState={
                                    expertMode ? getStoragePDiskDisplayState : undefined
                                }
                                getVDiskDisplayState={
                                    expertMode ? getStorageVDiskDisplayState : undefined
                                }
                                highlighted={highlighted}
                                highlightedDisk={
                                    relatedVDisks?.some(
                                        (vDisk) =>
                                            !vDisk.StringifiedId ||
                                            vDisk.StringifiedId === highlightedDisk,
                                    )
                                        ? highlightedDisk
                                        : undefined
                                }
                                setHighlightedDisk={setHighlightedDisk}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
});
