import type {TPDiskStateInfo} from '../../types/api/pdisk';
import type {TVDiskStateInfo} from '../../types/api/vdisk';
import {isNumeric} from '../utils';

import {calculatePDiskSeverity} from './calculatePDiskSeverity';
import {calculateVDiskSeverity} from './calculateVDiskSeverity';
import {getPDiskType} from './getPDiskType';
import type {PreparedPDisk, PreparedVDisk} from './types';

export function prepareVDiskData(vdiskState: TVDiskStateInfo = {}): PreparedVDisk {
    // Prepare PDisk only if it is present
    const PDisk = vdiskState.PDisk ? preparePDiskData(vdiskState.PDisk) : undefined;

    const AllocatedPercent = calculateVDiskAllocatedPercent(
        vdiskState.AllocatedSize,
        vdiskState.AvailableSize,
        PDisk?.AvailableSize,
    );

    const Donors = vdiskState.Donors?.map((donor) => {
        return prepareVDiskData({...donor, DonorMode: true});
    });

    const Severity = calculateVDiskSeverity(vdiskState);

    return {
        ...vdiskState,
        PDisk,
        AllocatedPercent,
        Donors,
        Severity,
    };
}

export function preparePDiskData(pdiskState: TPDiskStateInfo = {}): PreparedPDisk {
    const {AvailableSize, TotalSize, Category} = pdiskState;

    const Type = getPDiskType(Category);

    const AllocatedPercent = calculatePDiskAllocatedPercent(AvailableSize, TotalSize);

    const Severity = calculatePDiskSeverity(pdiskState, AllocatedPercent);

    return {
        ...pdiskState,
        Type,
        AllocatedPercent,
        Severity,
    };
}

function calculatePDiskAllocatedPercent(available: string | undefined, total: string | undefined) {
    if (!isNumeric(available) || !isNumeric(total)) {
        return undefined;
    }

    return Math.round(((Number(total) - Number(available)) * 100) / Number(total));
}

function calculateVDiskAllocatedPercent(
    allocated: string | undefined,
    availableOnVDisk: string | undefined,
    availableOnPDisk: string | undefined,
) {
    const available = availableOnVDisk ?? availableOnPDisk;

    if (!isNumeric(allocated) || !isNumeric(available)) {
        return undefined;
    }

    return Math.round((Number(allocated) * 100) / (Number(allocated) + Number(available)));
}
