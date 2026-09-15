import React from 'react';

import {cn} from '../../../utils/cn';
import {VDisksGroupBy} from '../../../utils/disks/groupBy';
import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import {PDiskWithVDisks} from '../PDisk/';
import type {StorageViewContext} from '../types';
import {useStorageNodesPDiskDisplayStateGetter} from '../useStoragePDiskDisplayStateGetter';
import {useIsStorageExpertMode, useNodesVDisksGroupByParam} from '../useStorageQueryParams';
import {useStorageNodesVDiskDisplayStateGetter} from '../useStorageVDiskDisplayStateGetter';
import {isPdiskActive} from '../utils';

import './PDisks.scss';

const b = cn('ydb-storage-pdisks');

interface PDisksProps {
    pDisks?: PreparedPDisk[];
    vDisks?: PreparedVDisk[];
    viewContext?: StorageViewContext;
    pDiskWidth?: number;
    pDiskHeight?: number;
}

export function PDisks({
    pDisks = [],
    vDisks = [],
    viewContext,
    pDiskWidth,
    pDiskHeight,
}: PDisksProps) {
    const [highlightedDisk, setHighlightedDisk] = React.useState<string | undefined>();
    const isStorageExpertMode = useIsStorageExpertMode();
    const vDisksGroupBy = useNodesVDisksGroupByParam();
    const isAllVDisksLayout = isStorageExpertMode && vDisksGroupBy === VDisksGroupBy.All;
    const getStoragePDiskDisplayState = useStorageNodesPDiskDisplayStateGetter();
    const getStorageVDiskDisplayState = useStorageNodesVDiskDisplayStateGetter();

    if (!pDisks.length) {
        return null;
    }

    return (
        <div className={b('pdisks-wrapper')} style={{height: pDiskHeight}}>
            {pDisks.map((pDisk) => {
                const id = pDisk.StringifiedId;

                const relatedVDisks = vDisks.filter((vdisk) => vdisk.PDiskId === pDisk.PDiskId);

                const highlighted = id !== undefined && highlightedDisk === id;

                return (
                    <div className={b('pdisks-item')} key={id}>
                        <PDiskWithVDisks
                            data={pDisk}
                            inactive={!isPdiskActive(pDisk, viewContext)}
                            vDisks={relatedVDisks}
                            viewContext={viewContext}
                            width={pDiskWidth}
                            withIcon={isStorageExpertMode}
                            withVDiskIcons={isStorageExpertMode}
                            getVDiskDisplayState={getStorageVDiskDisplayState}
                            expertMode={isStorageExpertMode}
                            isAllVDisksLayout={isAllVDisksLayout}
                            showTypeLabel={isStorageExpertMode}
                            getDisplayState={getStoragePDiskDisplayState}
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
