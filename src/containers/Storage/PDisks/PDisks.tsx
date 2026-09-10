import React from 'react';

import {cn} from '../../../utils/cn';
import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import {PDiskSvg} from '../PDisk/PDiskSvg';
import type {StorageViewContext} from '../types';
import {isPdiskActive} from '../utils';

import './PDisks.scss';

const b = cn('ydb-storage-pdisks');
const PDISK_MIN_WIDTH = 165;

interface PDisksProps {
    pDisks?: PreparedPDisk[];
    vDisks?: PreparedVDisk[];
    viewContext?: StorageViewContext;
    pDiskWidth?: number;
    inverted?: boolean;
}

export function PDisks({pDisks = [], vDisks = [], viewContext, pDiskWidth, inverted}: PDisksProps) {
    const [activeDiskKey, setActiveDiskKey] = React.useState<string | undefined>();

    if (!pDisks.length) {
        return null;
    }

    return (
        <div className={b('pdisks-wrapper')}>
            {pDisks.map((pDisk) => {
                const id = pDisk.StringifiedId;

                const relatedVDisks = vDisks.filter((vdisk) => vdisk.PDiskId === pDisk.PDiskId);

                return (
                    <div className={b('pdisks-item')} key={id}>
                        <PDiskSvg
                            data={pDisk}
                            inactive={!isPdiskActive(pDisk, viewContext)}
                            vDisks={relatedVDisks}
                            viewContext={viewContext}
                            width={pDiskWidth ?? PDISK_MIN_WIDTH}
                            inverted={inverted}
                            activeDiskKey={activeDiskKey}
                            setActiveDiskKey={setActiveDiskKey}
                        />
                    </div>
                );
            })}
        </div>
    );
}
