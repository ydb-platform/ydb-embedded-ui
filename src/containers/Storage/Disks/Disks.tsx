import React from 'react';

import {VDiskWithDonorsStack} from '../../../components/VDisk/VDiskWithDonorsStack';
import type {NodesMap} from '../../../types/store/nodesList';
import {cn} from '../../../utils/cn';
import {stringifyVdiskId} from '../../../utils/dataFormatters/dataFormatters';
import {getPDiskId} from '../../../utils/disks/helpers';
import type {PreparedVDisk} from '../../../utils/disks/types';
import {PDisk} from '../PDisk';

import './Disks.scss';

const b = cn('ydb-storage-disks');

interface DisksProps {
    vDisks?: PreparedVDisk[];
    nodes?: NodesMap;
}

export function Disks({vDisks = [], nodes}: DisksProps) {
    const [highlightedVDisk, setHighlightedVDisk] = React.useState<string | undefined>();

    if (!vDisks.length) {
        return null;
    }

    return (
        <div className={b(null)}>
            <div className={b('vdisks-wrapper')}>
                {vDisks?.map((vDisk) => {
                    return (
                        <VDiskItem
                            key={stringifyVdiskId(vDisk.VDiskId)}
                            vDisk={vDisk}
                            nodes={nodes}
                            highlightedVDisk={highlightedVDisk}
                            setHighlightedVDisk={setHighlightedVDisk}
                        />
                    );
                })}
            </div>

            <div className={b('pdisks-wrapper')}>
                {vDisks?.map((vDisk) => {
                    return (
                        <PDiskItem
                            key={getPDiskId(vDisk.NodeId, vDisk?.PDisk?.PDiskId)}
                            vDisk={vDisk}
                            nodes={nodes}
                            highlightedVDisk={highlightedVDisk}
                            setHighlightedVDisk={setHighlightedVDisk}
                        />
                    );
                })}
            </div>
        </div>
    );
}

interface DisksItemProps {
    nodes?: NodesMap;
    vDisk: PreparedVDisk;
    highlightedVDisk: string | undefined;
    setHighlightedVDisk: (id: string | undefined) => void;
}

function VDiskItem({nodes, vDisk, highlightedVDisk, setHighlightedVDisk}: DisksItemProps) {
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
            <VDiskWithDonorsStack
                data={vDiskToShow}
                nodes={nodes}
                compact
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
