import type {TPDiskInfo, TPDiskStateInfo} from '../../types/api/pdisk';
import type {TVDiskStateInfo} from '../../types/api/vdisk';

import {calculatePDiskSeverity} from './calculatePDiskSeverity';
import {calculateVDiskSeverity} from './calculateVDiskSeverity';
import {getPDiskType} from './getPDiskType';
import type {PreparedPDisk, PreparedVDisk} from './types';

export function prepareVDiskData(vdiskState: TVDiskStateInfo = {}): PreparedVDisk {
    // Prepare PDisk only if it is present
    const PDisk = vdiskState.PDisk
        ? preparePDiskData({
              ...vdiskState.PDisk,
              NodeId: vdiskState.PDisk.NodeId ?? vdiskState.NodeId,
          })
        : undefined;

    const PDiskId = vdiskState.PDiskId ?? PDisk?.PDiskId;

    const available = Number(vdiskState.AvailableSize ?? PDisk?.AvailableSize);
    const allocated = Number(vdiskState.AllocatedSize);
    const total = allocated + available;
    const allocatedPercent = Math.round((allocated * 100) / total);

    const Donors = vdiskState.Donors?.map((donor) => {
        return prepareVDiskData({...donor, DonorMode: true});
    });

    const Severity = calculateVDiskSeverity(vdiskState);

    return {
        ...vdiskState,
        PDisk,
        PDiskId,
        Donors,
        Severity,

        TotalSize: total,
        AllocatedPercent: allocatedPercent,
    };
}

export function preparePDiskData(
    pdiskState: TPDiskStateInfo = {},
    bscPDiskInfo: TPDiskInfo = {},
): PreparedPDisk {
    const {AvailableSize, TotalSize, Category} = pdiskState;

    const Type = getPDiskType(Category);

    const available = Number(AvailableSize);
    const total = Number(TotalSize);
    const allocated = total - available;
    const allocatedPercent = Math.round((allocated * 100) / total);

    const Severity = calculatePDiskSeverity(pdiskState, allocatedPercent);

    return {
        ...bscPDiskInfo,
        ...pdiskState,
        Type,
        Severity,

        AllocatedSize: allocated,
        AllocatedPercent: allocatedPercent,
    };
}
