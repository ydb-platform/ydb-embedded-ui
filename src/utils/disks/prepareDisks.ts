import {isNil} from 'lodash';

import type {TPDiskStateInfo} from '../../types/api/pdisk';
import type {TVDiskStateInfo, TVSlotId} from '../../types/api/vdisk';
import {stringifyVdiskId} from '../dataFormatters/dataFormatters';
import {isNumeric} from '../utils';

import {calculatePDiskSeverity} from './calculatePDiskSeverity';
import {calculateVDiskSeverity} from './calculateVDiskSeverity';
import {getPDiskType} from './getPDiskType';
import {getPDiskId, isFullVDiskData} from './helpers';
import type {PreparedPDisk, PreparedVDisk} from './types';

export function prepareWhiteboardVDiskData(
    vDiskState: TVDiskStateInfo | TVSlotId = {},
): PreparedVDisk {
    if (!isFullVDiskData(vDiskState)) {
        const {NodeId, PDiskId, VSlotId} = vDiskState;

        const vDiskId =
            !isNil(VSlotId) && !isNil(PDiskId) && !isNil(NodeId)
                ? {
                      NodeId,
                      PDiskId,
                      VSlotId,
                  }
                : undefined;

        const StringifiedId = stringifyVdiskId(vDiskId);

        return {
            StringifiedId,
            NodeId,
            PDiskId,
            // Replace VSlotId with VDiskSlotId to match with PreparedVDisk type
            VDiskSlotId: VSlotId,
        };
    }

    const {
        PDisk,
        PDiskId,
        VDiskId,
        NodeId,
        Donors,
        AvailableSize,
        AllocatedSize,
        ...restVDiskFields
    } = vDiskState;

    // Prepare PDisk only if it is present
    const preparedPDisk = PDisk
        ? prepareWhiteboardPDiskData({...PDisk, NodeId: PDisk?.NodeId ?? NodeId})
        : undefined;

    const actualPDiskId = PDiskId ?? preparedPDisk?.PDiskId;

    const vDiskSizeFields = prepareVDiskSizeFields({
        AvailableSize: AvailableSize,
        AllocatedSize: AllocatedSize,
        SlotSize: PDisk?.EnforcedDynamicSlotSize,
    });

    const Severity = calculateVDiskSeverity(vDiskState);

    const StringifiedId = stringifyVdiskId(VDiskId);

    const preparedDonors = Donors?.map((donor) => {
        // Handle both TVDiskStateInfo and TVSlotId donor types
        if (isFullVDiskData(donor)) {
            // Full VDisk data
            return prepareWhiteboardVDiskData({...donor, DonorMode: true});
        } else {
            // TVSlotId data - create a minimal PreparedVDisk
            const {NodeId: dNodeId, PDiskId: dPDiskId, VSlotId: vSlotId} = donor;
            const stringifiedId =
                !isNil(dNodeId) && !isNil(dPDiskId) && !isNil(vSlotId)
                    ? `${dNodeId}-${dPDiskId}-${vSlotId}`
                    : '';

            return {
                NodeId: dNodeId,
                PDiskId: dPDiskId,
                VDiskSlotId: vSlotId,
                StringifiedId: stringifiedId,
                DonorMode: true,
            };
        }
    });

    return {
        ...restVDiskFields,
        ...vDiskSizeFields,

        VDiskId,
        NodeId,
        PDiskId: actualPDiskId,
        PDisk: preparedPDisk,
        Donors: preparedDonors,

        Severity,
        StringifiedId,
    };
}

export function prepareWhiteboardPDiskData(pdiskState: TPDiskStateInfo = {}): PreparedPDisk {
    const {
        AvailableSize,
        TotalSize,
        Category,
        State,
        PDiskId,
        NodeId,
        EnforcedDynamicSlotSize,
        ...restPDiskFields
    } = pdiskState;

    const StringifiedId = getPDiskId({nodeId: NodeId, pDiskId: PDiskId});

    const Type = getPDiskType(Category);

    const pdiskPreparedSizeFields = preparePDiskSizeFields({
        AvailableSize,
        TotalSize,
    });

    const Severity = calculatePDiskSeverity({
        State,
        AllocatedPercent: pdiskPreparedSizeFields.AllocatedPercent,
    });

    return {
        ...restPDiskFields,
        ...pdiskPreparedSizeFields,
        PDiskId,
        NodeId,
        StringifiedId,
        Type,
        Category,
        State,
        Severity,
        SlotSize: EnforcedDynamicSlotSize,
    };
}

export function prepareVDiskSizeFields({
    AvailableSize,
    AllocatedSize,
    SlotSize,
}: {
    AvailableSize: string | number | undefined;
    AllocatedSize: string | number | undefined;
    SlotSize: string | number | undefined;
}) {
    const parsedAvailable = Number(AvailableSize);
    const hasKnownAvailableSize = isNumeric(AvailableSize) && parsedAvailable >= 0;
    const available = hasKnownAvailableSize ? parsedAvailable : 0;
    // Unlike available, allocated is displayed in UI, it is incorrect to fallback it to 0
    const allocated = Number(AllocatedSize);
    const slotSize = Number(SlotSize);
    const hasSizeLimitFallback = !available && Boolean(slotSize);

    let sizeLimit = allocated + available;

    // If no available size or available size is 0, slot size should be used as limit
    if (hasSizeLimitFallback) {
        sizeLimit = slotSize;
    }

    const freeSize = getVDiskFreeSize({
        available,
        allocated,
        sizeLimit,
        hasKnownAvailableSize,
        hasSizeLimitFallback,
    });
    const allocatedPercent = sizeLimit > 0 ? Math.floor((allocated * 100) / sizeLimit) : NaN;

    return {
        AvailableSize: available,
        AllocatedSize: allocated,
        SizeLimit: sizeLimit,
        FreeSize: freeSize,
        AllocatedPercent: allocatedPercent,
    };
}

function getVDiskFreeSize({
    available,
    allocated,
    sizeLimit,
    hasKnownAvailableSize,
    hasSizeLimitFallback,
}: {
    available: number;
    allocated: number;
    sizeLimit: number;
    hasKnownAvailableSize: boolean;
    hasSizeLimitFallback: boolean;
}) {
    if (!hasSizeLimitFallback && hasKnownAvailableSize) {
        return available;
    }

    if (!Number.isFinite(sizeLimit) || sizeLimit < 0) {
        return NaN;
    }

    if (!Number.isFinite(allocated) || allocated < 0) {
        return hasSizeLimitFallback ? NaN : sizeLimit;
    }

    if (hasSizeLimitFallback) {
        return Math.max(sizeLimit - allocated, 0);
    }

    if (Number.isFinite(available) && available >= 0) {
        return available;
    }

    return Math.max(sizeLimit - allocated, 0);
}

export function preparePDiskSizeFields({
    AvailableSize,
    TotalSize,
}: {
    AvailableSize: string | number | undefined;
    TotalSize: string | number | undefined;
}) {
    const available = Number(AvailableSize);
    const total = Number(TotalSize);
    const allocated = total - available;
    // Return NaN if total is 0 or invalid to indicate no data
    const allocatedPercent = total > 0 ? Math.floor((allocated * 100) / total) : NaN;

    return {
        AvailableSize: available,
        TotalSize: total,
        AllocatedSize: allocated,
        AllocatedPercent: allocatedPercent,
    };
}
