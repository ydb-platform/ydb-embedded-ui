import {VDiskWithDonorsStack} from '../../../components/VDisk/VDiskWithDonorsStack';
import type {Erasure} from '../../../types/api/storage';
import {cn} from '../../../utils/cn';
import type {PreparedVDisk} from '../../../utils/disks/types';
import type {StorageViewContext} from '../types';
import {isVdiskActive, useVDisksWithDCMargins} from '../utils';

import './VDisks.scss';

const b = cn('ydb-storage-vdisks');

interface VDisksProps {
    vDisks?: PreparedVDisk[];
    viewContext?: StorageViewContext;
    erasure?: Erasure;
    database?: string;
}

export function VDisks({vDisks, viewContext, erasure, database}: VDisksProps) {
    const vDisksWithDCMargins = useVDisksWithDCMargins(vDisks, erasure);

    return (
        <div className={b('wrapper')}>
            {vDisks?.map((vDisk, index) => (
                <VDiskWithDonorsStack
                    database={database}
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
