import React from 'react';

import {cn} from '../../../utils/cn';
import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import {PDisk} from '../PDisk/';
import type {StorageViewContext} from '../types';

import './PDisks.scss';

const b = cn('ydb-storage-pdisks');

interface PDisksProps {
    pDisks?: PreparedPDisk[];
    vDisks?: PreparedVDisk[];
    viewContext?: StorageViewContext;
    pDiskWidth?: number;
}

export function PDisks({pDisks = [], vDisks = [], viewContext, pDiskWidth}: PDisksProps) {
    const [highlightedDisk, setHighlightedDisk] = React.useState<string | undefined>();

    if (!pDisks.length) {
        return null;
    }

    return (
        <div className={b('pdisks-wrapper')}>
            {pDisks.map((pDisk) => {
                const id = pDisk.StringifiedId;

                const relatedVDisks = vDisks.filter((vdisk) => vdisk.PDiskId === pDisk.PDiskId);

                const highlighted = highlightedDisk === id;

                return (
                    <div className={b('pdisks-item')} key={id}>
                        <PDisk
                            data={pDisk}
                            vDisks={relatedVDisks}
                            viewContext={viewContext}
                            width={pDiskWidth}
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
