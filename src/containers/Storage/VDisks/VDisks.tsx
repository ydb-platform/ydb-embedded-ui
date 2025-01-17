import {VDiskWithDonorsStack} from '../../../components/VDisk/VDiskWithDonorsStack';
import {cn} from '../../../utils/cn';
import type {PreparedVDisk} from '../../../utils/disks/types';
import type {StorageViewContext} from '../types';
import {isVdiskActive, useVDisksWithDCMargins} from '../utils';

import './VDisks.scss';

const b = cn('ydb-storage-vdisks');

interface VDisksProps {
    vDisks?: PreparedVDisk[];
    viewContext?: StorageViewContext;
}

export function VDisks({vDisks, viewContext}: VDisksProps) {
    const vDisksWithDCMargins = useVDisksWithDCMargins(vDisks);

    return (
        <div className={b('wrapper')}>
            {vDisks?.map((vDisk, index) => (
                <VDiskWithDonorsStack
                    key={vDisk.StringifiedId}
                    data={vDisk}
                    inactive={!isVdiskActive(vDisk, viewContext)}
                    className={b('item', {
                        'with-dc-margin': vDisksWithDCMargins.includes(index),
                    })}
                />
            ))}
        </div>
    );
}
