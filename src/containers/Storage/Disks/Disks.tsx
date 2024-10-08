import React from 'react';

import {VDisk} from '../../../components/VDisk/VDisk';
import {cn} from '../../../utils/cn';
import {stringifyVdiskId} from '../../../utils/dataFormatters/dataFormatters';
import {getPDiskId} from '../../../utils/disks/helpers';
import type {PreparedVDisk} from '../../../utils/disks/types';
import {PDisk} from '../PDisk';
import type {StorageViewContext} from '../types';
import {isVdiskActive} from '../utils';

import './Disks.scss';

const b = cn('ydb-storage-disks');

interface DisksProps {
    vDisks?: PreparedVDisk[];
    viewContext?: StorageViewContext;
}

export function Disks({vDisks = [], viewContext}: DisksProps) {
    const [highlightedVDisk, setHighlightedVDisk] = React.useState<string | undefined>();

    if (!vDisks.length) {
        return null;
    }

    return (
        <div className={b(null)}>
            <div className={b('vdisks-wrapper')}>
                {vDisks?.map((vDisk) => (
                    <VDiskItem
                        key={stringifyVdiskId(vDisk.VDiskId)}
                        vDisk={vDisk}
                        inactive={!isVdiskActive(vDisk, viewContext)}
                        highlightedVDisk={highlightedVDisk}
                        setHighlightedVDisk={setHighlightedVDisk}
                    />
                ))}
            </div>

            <div className={b('pdisks-wrapper')}>
                {vDisks?.map((vDisk) => (
                    <PDiskItem
                        key={getPDiskId(vDisk.NodeId, vDisk?.PDisk?.PDiskId)}
                        vDisk={vDisk}
                        highlightedVDisk={highlightedVDisk}
                        setHighlightedVDisk={setHighlightedVDisk}
                    />
                ))}
            </div>
        </div>
    );
}

interface DisksItemProps {
    vDisk: PreparedVDisk;
    inactive?: boolean;
    highlightedVDisk: string | undefined;
    setHighlightedVDisk: (id: string | undefined) => void;
}

function VDiskItem({vDisk, highlightedVDisk, inactive, setHighlightedVDisk}: DisksItemProps) {
    // Do not show PDisk popup for VDisk
    const vDiskToShow = {...vDisk, PDisk: undefined};

    const vDiskId = stringifyVdiskId(vDisk.VDiskId);

    return (
        <div
            style={{
                flexGrow: Number(vDisk.AllocatedSize) || 1,
            }}
            className={b('vdisk-item')}
        >
            <VDisk
                data={vDiskToShow}
                compact
                inactive={inactive}
                showPopup={highlightedVDisk === vDiskId}
                onShowPopup={() => setHighlightedVDisk(vDiskId)}
                onHidePopup={() => setHighlightedVDisk(undefined)}
                progressBarClassName={b('vdisk-progress-bar')}
            />
        </div>
    );
}

function PDiskItem({vDisk, highlightedVDisk, setHighlightedVDisk}: DisksItemProps) {
    const vDiskId = stringifyVdiskId(vDisk.VDiskId);

    if (!vDisk.PDisk) {
        return null;
    }

    return (
        <PDisk
            className={b('pdisk-item')}
            progressBarClassName={b('pdisk-progress-bar')}
            data={vDisk.PDisk}
            showPopup={highlightedVDisk === vDiskId}
            onShowPopup={() => setHighlightedVDisk(vDiskId)}
            onHidePopup={() => setHighlightedVDisk(undefined)}
        />
    );
}
