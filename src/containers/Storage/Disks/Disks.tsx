import React from 'react';

import {VDiskWithDonorsStack} from '../../../components/VDisk/VDiskWithDonorsStack';
import type {NodesMap} from '../../../types/store/nodesList';
import {cn} from '../../../utils/cn';
import {stringifyVdiskId} from '../../../utils/dataFormatters/dataFormatters';
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

    return (
        <div className={b(null)}>
            <div className={b('vdisks-wrapper')}>
                {vDisks?.map((vDisk) => {
                    // Do not show PDisk popup for VDisk
                    const vDiskToShow = {...vDisk, PDisk: undefined};

                    const vDiskId = stringifyVdiskId(vDisk.VDiskId);

                    return (
                        <div
                            key={stringifyVdiskId(vDisk.VDiskId)}
                            style={{
                                flexGrow: Number(vDisk.AllocatedSize) || 1,
                            }}
                            className={b('vdisk-item')}
                        >
                            <VDiskWithDonorsStack
                                data={vDiskToShow}
                                nodes={nodes}
                                compact={true}
                                showPopup={highlightedVDisk === vDiskId}
                                onShowPopup={() => setHighlightedVDisk(vDiskId)}
                                onHidePopup={() => setHighlightedVDisk(undefined)}
                                progressBarClassName={b('vdisk-progress-bar')}
                            />
                        </div>
                    );
                })}
            </div>

            <div className={b('pdisks-wrapper')}>
                {vDisks?.map((vDisk) => {
                    const vDiskId = stringifyVdiskId(vDisk.VDiskId);

                    if (!vDisk.PDisk) {
                        return null;
                    }

                    return (
                        <PDisk
                            key={vDisk.PDisk.PDiskId}
                            className={b('pdisk-item')}
                            progressBarClassName={b('pdisk-progress-bar')}
                            data={vDisk.PDisk}
                            showPopup={highlightedVDisk === vDiskId}
                            onShowPopup={() => setHighlightedVDisk(vDiskId)}
                            onHidePopup={() => setHighlightedVDisk(undefined)}
                        />
                    );
                })}
            </div>
        </div>
    );
}
