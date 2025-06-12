import {valueIsDefined} from '..';
import type {TPDiskStateInfo} from '../../types/api/pdisk';
import type {TVDiskStateInfo, TVSlotId} from '../../types/api/vdisk';
import {stringifyVdiskId} from '../dataFormatters/dataFormatters';

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
            valueIsDefined(VSlotId) && valueIsDefined(PDiskId) && valueIsDefined(NodeId)
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
        AvailableSize: AvailableSize ?? PDisk?.AvailableSize,
        AllocatedSize: AllocatedSize,
    });

    const Severity = calculateVDiskSeverity(vDiskState);

    const StringifiedId = stringifyVdiskId(VDiskId);

    const preparedDonors = Donors?.map((donor) => {
        return prepareWhiteboardVDiskData({...donor, DonorMode: true});
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
}: {
    AvailableSize: string | number | undefined;
    AllocatedSize: string | number | undefined;
}) {
    const available = Number(AvailableSize);
    const allocated = Number(AllocatedSize);
    const total = allocated + available;
    const allocatedPercent = Math.floor((allocated * 100) / total);

    return {
        AvailableSize: available,
        AllocatedSize: allocated,
        TotalSize: total,
        AllocatedPercent: allocatedPercent,
    };
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
    const allocatedPercent = Math.floor((allocated * 100) / total);

    return {
        AvailableSize: available,
        TotalSize: total,
        AllocatedSize: allocated,
        AllocatedPercent: allocatedPercent,
    };
}
