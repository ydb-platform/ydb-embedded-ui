import React from 'react';

import {VDiskWithDonorsStack} from '../../../components/VDisk/VDiskWithDonorsStack';
import type {Erasure} from '../../../types/api/storage';
import {cn} from '../../../utils/cn';
import type {PreparedVDisk} from '../../../utils/disks/types';
import {DISKS_POPUP_DEBOUNCE_TIMEOUT} from '../shared';
import type {StorageViewContext} from '../types';
import {isVdiskActive, useVDisksWithDCMargins} from '../utils';

import './VDisks.scss';

const b = cn('ydb-storage-vdisks');

interface VDisksProps {
    vDisks?: PreparedVDisk[];
    viewContext?: StorageViewContext;
    erasure?: Erasure;
    withIcon?: boolean;
}

export function VDisks({vDisks, viewContext, erasure, withIcon}: VDisksProps) {
    const vDisksWithDCMargins = useVDisksWithDCMargins(vDisks, erasure);

    const [highlightedVDisk, setHighlightedVDisk] = React.useState<string | undefined>();

    return (
        <div className={b('wrapper')}>
            {vDisks?.map((vDisk, index) => (
                <VDiskWithDonorsStack
                    withIcon={withIcon}
                    key={vDisk.StringifiedId}
                    data={vDisk}
                    inactive={!isVdiskActive(vDisk, viewContext)}
                    delayOpen={DISKS_POPUP_DEBOUNCE_TIMEOUT}
                    delayClose={DISKS_POPUP_DEBOUNCE_TIMEOUT}
                    className={b('item', {
                        'with-dc-margin': vDisksWithDCMargins.includes(index),
                    })}
                    highlightedVDisk={highlightedVDisk}
                    setHighlightedVDisk={setHighlightedVDisk}
                    progressBarClassName={b('vdisks-progress-bar')}
                />
            ))}
        </div>
    );
}
