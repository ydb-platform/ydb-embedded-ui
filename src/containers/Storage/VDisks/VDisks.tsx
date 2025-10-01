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
}

export function VDisks({vDisks, viewContext, erasure}: VDisksProps) {
    const vDisksWithDCMargins = useVDisksWithDCMargins(vDisks, erasure);

    return (
        <div className={b('wrapper')}>
            {vDisks?.map((vDisk, index) => (
                <VDiskWithDonorsStack
                    key={vDisk.StringifiedId}
                    data={vDisk}
                    inactive={!isVdiskActive(vDisk, viewContext)}
                    delayOpen={DISKS_POPUP_DEBOUNCE_TIMEOUT}
                    delayClose={DISKS_POPUP_DEBOUNCE_TIMEOUT}
                    className={b('item', {
                        'with-dc-margin': vDisksWithDCMargins.includes(index),
                    })}
                />
            ))}
        </div>
    );
}
