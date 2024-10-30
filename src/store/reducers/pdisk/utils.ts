import type {TPDiskInfoResponse} from '../../../types/api/pdisk';
import type {TEvSystemStateResponse} from '../../../types/api/systemState';
import {getArray, valueIsDefined} from '../../../utils';
import {
    prepareWhiteboardPDiskData,
    prepareWhiteboardVDiskData,
} from '../../../utils/disks/prepareDisks';
import {prepareNodeSystemState} from '../../../utils/nodes';

import type {PDiskData, SlotItem} from './types';

export function preparePDiskDataResponse([pdiskResponse = {}, nodeResponse]: [
    TPDiskInfoResponse,
    TEvSystemStateResponse,
]): PDiskData {
    const rawNode = nodeResponse.SystemStateInfo?.[0];
    const preparedNode = prepareNodeSystemState(rawNode);

    const {BSC = {}, Whiteboard = {}} = pdiskResponse || {};

    const {PDisk: WhiteboardPDiskData = {}, VDisks: WhiteboardVDisksData = []} = Whiteboard;
    const {PDisk: BSCPDiskData = {}} = BSC;

    const preparedPDisk = prepareWhiteboardPDiskData({
        ...BSCPDiskData,
        ...WhiteboardPDiskData,
    });

    const NodeId = preparedPDisk.NodeId ?? preparedNode.NodeId;

    const {
        LogUsedSize,
        LogTotalSize,
        TotalSize: PDiskTotalSize,
        SystemSize,
        ExpectedSlotCount,
        EnforcedDynamicSlotSize,
    } = preparedPDisk;

    let logSlot: SlotItem<'log'> | undefined;

    if (valueIsDefined(LogTotalSize)) {
        logSlot = {
            SlotType: 'log',
            Used: Number(LogUsedSize),
            Total: Number(LogTotalSize),
            UsagePercent: (Number(LogUsedSize) * 100) / Number(LogTotalSize),
            Severity: 1,
            SlotData: {
                LogUsedSize,
                LogTotalSize,
                SystemSize,
            },
        };
    }

    const preparedVDisks = WhiteboardVDisksData.map((disk) =>
        prepareWhiteboardVDiskData({...disk, NodeId}),
    );
    preparedVDisks.sort((disk1, disk2) => Number(disk2.VDiskSlotId) - Number(disk1.VDiskSlotId));

    const vdisksSlots: SlotItem<'vDisk'>[] = preparedVDisks.map((preparedVDisk) => {
        return {
            SlotType: 'vDisk',
            Id: preparedVDisk.VDiskId?.GroupID,
            Title: preparedVDisk.StoragePoolName,
            Severity: preparedVDisk.Severity,
            Used: Number(preparedVDisk.AllocatedSize),
            Total: Number(preparedVDisk.TotalSize),
            UsagePercent: preparedVDisk.AllocatedPercent,

            SlotData: preparedVDisk,
        };
    });

    let emptySlots: SlotItem<'empty'>[] = [];

    if (ExpectedSlotCount && ExpectedSlotCount > vdisksSlots.length) {
        const emptySlotsCount = ExpectedSlotCount - vdisksSlots.length;

        let emptySlotSize = Number(EnforcedDynamicSlotSize);

        if (isNaN(emptySlotSize)) {
            const vDisksTotalSize = vdisksSlots.reduce((sum, item) => {
                return item.Total ? sum + item.Total : sum;
            }, 0);
            emptySlotSize =
                (Number(PDiskTotalSize) - vDisksTotalSize - Number(LogTotalSize)) / emptySlotsCount;
        }

        emptySlots = getArray(emptySlotsCount).map((): SlotItem<'empty'> => {
            return {
                SlotType: 'empty',
                Total: emptySlotSize,
                Severity: 1,
                SlotData: {
                    Size: emptySlotSize,
                },
            };
        });
    }

    const diskSlots: PDiskData['SlotItems'] = [...vdisksSlots, ...emptySlots];

    if (logSlot && diskSlots.length > 0) {
        diskSlots.unshift(logSlot);
    }

    return {
        ...preparedPDisk,
        NodeId,
        NodeHost: preparedNode.Host,
        NodeType: preparedNode.Roles?.[0],
        NodeDC: preparedNode.DC,
        SlotItems: diskSlots,
    };
}
