import React from 'react';
import cn from 'bem-cn-lite';

import type {PreparedStructureVDisk} from '../../../store/reducers/node/types';
import {EVDiskState} from '../../../types/api/vdisk';
import {EFlag} from '../../../types/api/enums';
import {stringifyVdiskId} from '../../../utils/dataFormatters/dataFormatters';
import {EntityStatus} from '../../../components/EntityStatus/EntityStatus';
import {VDiskInfo} from '../../../components/VDiskInfo/VDiskInfo';

const b = cn('kv-node-structure');

interface VDiskProps {
    data: PreparedStructureVDisk;
}

export function Vdisk({data}: VDiskProps) {
    const {VDiskState, VDiskId} = data;

    return (
        <React.Fragment>
            <div className={b('row')}>
                <span className={b('title')}>VDisk </span>
                <EntityStatus
                    status={VDiskState === EVDiskState.OK ? EFlag.Green : EFlag.Red}
                    name={stringifyVdiskId(VDiskId)}
                />
            </div>

            <div className={b('column')}>
                <VDiskInfo className={b('section')} data={data} />
            </div>
        </React.Fragment>
    );
}
