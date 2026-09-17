import React from 'react';

import {cn} from '../../../utils/cn';
import {VDisksGroupBy} from '../../../utils/disks/groupBy';
import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import {PDiskWithVDisks} from '../PDisk/';
import type {StorageViewContext} from '../types';
import {useStorageNodesPDiskDisplayStateGetter} from '../useStoragePDiskDisplayStateGetter';
import {useNodesVDisksGroupByParam} from '../useStorageQueryParams';
import {useStorageNodesVDiskDisplayStateGetter} from '../useStorageVDiskDisplayStateGetter';
import {isPdiskActive} from '../utils';

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

export function PDisks({
    pDisks = [],
    vDisks = EMPTY_VDISKS,
    viewContext,
    pDiskWidth,
    pDiskHeight,
    expertMode = false,
}: PDisksProps) {
    const [highlightedDisk, setHighlightedDisk] = React.useState<string | undefined>();
    const vDisksGroupBy = useNodesVDisksGroupByParam();
    const isAllVDisksLayout = expertMode && vDisksGroupBy === VDisksGroupBy.All;
    const getStoragePDiskDisplayState = useStorageNodesPDiskDisplayStateGetter();
    const getStorageVDiskDisplayState = useStorageNodesVDiskDisplayStateGetter();
    const vDisksByPDisk = React.useMemo(() => {
        const disksByPDisk = new Map<PreparedVDisk['PDiskId'], PreparedVDisk[]>();
        for (const vDisk of vDisks) {
            const disks = disksByPDisk.get(vDisk.PDiskId);
            if (disks) {
                disks.push(vDisk);
            } else {
                disksByPDisk.set(vDisk.PDiskId, [vDisk]);
            }
        }
        return disksByPDisk;
    }, [vDisks]);

    if (!pDisks.length) {
        return null;
    }

    return (
        <div className={b('pdisks-wrapper')} style={{height: pDiskHeight}}>
            {pDisks.map((pDisk) => {
                const id = pDisk.StringifiedId;

                const relatedVDisks = vDisksByPDisk.get(pDisk.PDiskId);

                const highlighted = id !== undefined && highlightedDisk === id;

                return (
                    <div className={b('pdisks-item')} key={id}>
                        <PDiskWithVDisks
                            data={pDisk}
                            inactive={!isPdiskActive(pDisk, viewContext)}
                            vDisks={relatedVDisks}
                            viewContext={viewContext}
                            width={pDiskWidth}
                            withIcon={expertMode}
                            withVDiskIcons={expertMode}
                            getVDiskDisplayState={
                                expertMode ? getStorageVDiskDisplayState : undefined
                            }
                            expertMode={expertMode}
                            isAllVDisksLayout={isAllVDisksLayout}
                            showTypeLabel={expertMode}
                            getDisplayState={expertMode ? getStoragePDiskDisplayState : undefined}
                            showPopup={highlighted}
                            onShowPopup={() => setHighlightedDisk(id)}
                            onHidePopup={() => setHighlightedDisk(undefined)}
                            highlighted={highlighted}
                            highlightedDisk={highlightedDisk}
                            setHighlightedDisk={setHighlightedDisk}
                        />
                    </div>
                );
            })}
        </div>
    );
}
