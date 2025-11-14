import {isNil} from 'lodash';

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
    const available = Number(AvailableSize ?? 0);
    // Unlike available, allocated is displayed in UI, it is incorrect to fallback it to 0
    const allocated = Number(AllocatedSize);
    const slotSize = Number(SlotSize);

    let sizeLimit = allocated + available;

    // If no available size or available size is 0, slot size should be used as limit
    if (!available && slotSize) {
        sizeLimit = slotSize;
    }

    const allocatedPercent = sizeLimit > 0 ? Math.floor((allocated * 100) / sizeLimit) : NaN;

    return {
        AvailableSize: available,
        AllocatedSize: allocated,
        SizeLimit: sizeLimit,
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
