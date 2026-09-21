import React from 'react';

import {VDiskWithDonorsStack} from '../../../components/VDisk/VDiskWithDonorsStack';
import type {Erasure} from '../../../types/api/storage';
import {cn} from '../../../utils/cn';
import type {PreparedVDisk} from '../../../utils/disks/types';
import {DISKS_POPUP_DEBOUNCE_TIMEOUT} from '../shared';
import type {StorageViewContext} from '../types';
import {isVdiskActive, useVDisksWithDCMargins} from '../utils';
import {useVirtualizedDiskList} from '../utils/useVirtualizedDiskList';

import './VDisks.scss';

const b = cn('ydb-storage-vdisks');
const EMPTY_VDISKS: PreparedVDisk[] = [];
const VDiskItem = React.memo(VDiskWithDonorsStack);

interface VDisksProps {
    vDisks?: PreparedVDisk[];
    viewContext?: StorageViewContext;
    erasure?: Erasure;
    withIcon?: boolean;
}

export const VDisks = React.memo(function VDisks({
    vDisks = EMPTY_VDISKS,
    viewContext,
    erasure,
    withIcon,
}: VDisksProps) {
    const vDisksWithDCMargins = useVDisksWithDCMargins(vDisks, erasure);

    const [highlightedVDisk, setHighlightedVDisk] = React.useState<string | undefined>();
    const {containerRef, shouldRenderDisk} = useVirtualizedDiskList(
        vDisks,
        vDisks.every((disk) => Boolean(disk.StringifiedId)),
    );

    React.useEffect(() => {
        setHighlightedVDisk((id) =>
            vDisks.some((disk) => disk.StringifiedId === id) ? id : undefined,
        );
    }, [vDisks]);

    return (
        <div className={b('wrapper')} ref={containerRef}>
            {vDisks.map((vDisk, index) => (
                <VDiskItem
                    withIcon={withIcon}
                    renderContent={shouldRenderDisk(index)}
                    key={vDisk.StringifiedId || index}
                    data={vDisk}
                    inactive={!isVdiskActive(vDisk, viewContext)}
                    delayOpen={DISKS_POPUP_DEBOUNCE_TIMEOUT}
                    delayClose={DISKS_POPUP_DEBOUNCE_TIMEOUT}
                    className={b('item', {
                        'with-dc-margin': vDisksWithDCMargins.includes(index),
                    })}
                    highlightedVDisk={
                        highlightedVDisk === vDisk.StringifiedId ? highlightedVDisk : undefined
                    }
                    setHighlightedVDisk={setHighlightedVDisk}
                    progressBarClassName={b('vdisks-progress-bar')}
                />
            ))}
        </div>
    );
});
