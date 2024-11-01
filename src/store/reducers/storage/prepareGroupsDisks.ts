import type {TStoragePDisk, TStorageVDisk} from '../../../types/api/storage';
import {stringifyVdiskId} from '../../../utils/dataFormatters/dataFormatters';
import {calculatePDiskSeverity} from '../../../utils/disks/calculatePDiskSeverity';
import {calculateVDiskSeverity} from '../../../utils/disks/calculateVDiskSeverity';
import {getPDiskType} from '../../../utils/disks/getPDiskType';
import {getPDiskId} from '../../../utils/disks/helpers';
import {preparePDiskSizeFields, prepareVDiskSizeFields} from '../../../utils/disks/prepareDisks';
import type {PDiskType, PreparedVDisk} from '../../../utils/disks/types';

export function prepareGroupsVDisk(data: TStorageVDisk = {}): PreparedVDisk {
    const {Whiteboard: whiteboardVDisk = {}, PDisk, ...bscVDisk} = data;

    const mergedVDiskData = {
        ...whiteboardVDisk,
        ...bscVDisk,
        VDiskId: whiteboardVDisk.VDiskId,
    };

    const preparedPDisk = PDisk
        ? prepareGroupsPDisk({...PDisk, NodeId: mergedVDiskData.NodeId})
        : undefined;

    const PDiskId = preparedPDisk?.PDiskId ?? whiteboardVDisk?.PDiskId;

    const StringifiedId = bscVDisk.VDiskId ?? stringifyVdiskId(whiteboardVDisk.VDiskId);

    const Severity = calculateVDiskSeverity(mergedVDiskData);

    const vDiskSizeFields = prepareVDiskSizeFields({
        AvailableSize: mergedVDiskData.AvailableSize ?? PDisk?.AvailableSize,
        AllocatedSize: mergedVDiskData.AllocatedSize,
    });

    const preparedDonors = bscVDisk.Donors?.map((donor) => {
        return prepareGroupsVDisk({
            ...donor,
            Whiteboard: {...donor.Whiteboard, DonorMode: true},
        });
    });

    return {
        ...mergedVDiskData,
        ...vDiskSizeFields,
        PDisk: preparedPDisk,
        Donors: preparedDonors,
        PDiskId,
        StringifiedId,
        Severity,
    };
}

export function prepareGroupsPDisk(data: TStoragePDisk & {NodeId?: number} = {}) {
    const {Whiteboard: whiteboardPDisk, ...bscPDisk} = data;

    const mergedPDiskData = {
        ...whiteboardPDisk,
        ...bscPDisk,
        PDiskId: whiteboardPDisk?.PDiskId,
    };

    const StringifiedId =
        bscPDisk.PDiskId || getPDiskId(mergedPDiskData.NodeId, mergedPDiskData.PDiskId);

    const {AllocatedPercent, AllocatedSize, AvailableSize, TotalSize} = preparePDiskSizeFields({
        AvailableSize: mergedPDiskData.AvailableSize,
        TotalSize: mergedPDiskData.TotalSize,
    });

    const Type =
        (bscPDisk.Type?.toUpperCase() as PDiskType) ?? getPDiskType(whiteboardPDisk?.Category);

    const Severity = calculatePDiskSeverity({
        State: whiteboardPDisk?.State,
        AllocatedPercent,
    });

    const SlotSize = bscPDisk.SlotSize ?? whiteboardPDisk?.EnforcedDynamicSlotSize;

    return {
        ...mergedPDiskData,
        StringifiedId,
        AllocatedPercent,
        AllocatedSize,
        AvailableSize,
        TotalSize,
        Type,
        Severity,
        SlotSize,
    };
}
