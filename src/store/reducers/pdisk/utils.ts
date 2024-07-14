import type {TPDiskInfoResponse} from '../../../types/api/pdisk';
import type {TStorageInfo} from '../../../types/api/storage';
import type {TEvSystemStateResponse} from '../../../types/api/systemState';
import {getArray} from '../../../utils';
import {preparePDiskData, prepareVDiskData} from '../../../utils/disks/prepareDisks';
import {prepareNodeSystemState} from '../../../utils/nodes';
import type {PreparedStorageGroup} from '../storage/types';
import {prepareStorageGroupData} from '../storage/utils';

import type {PDiskData, SlotItem} from './types';

export function preparePDiskDataResponse([pdiskResponse = {}, nodeResponse]: [
    TPDiskInfoResponse,
    TEvSystemStateResponse,
]): PDiskData {
    const {BSC = {}, Whiteboard = {}} = pdiskResponse || {};

    const {PDisk: WhiteboardPDiskData = {}, VDisks: WhiteboardVDisksData = []} = Whiteboard;
    const {PDisk: BSCPDiskData = {}} = BSC;

    const {ExpectedSlotCount, EnforcedDynamicSlotSize} = BSCPDiskData;

    const preparedPDisk = preparePDiskData(WhiteboardPDiskData);

    const {LogUsedSize, LogTotalSize, TotalSize: PDiskTotalSize} = preparedPDisk;

    const logSlot: SlotItem = {
        SlotType: 'log',
        Used: Number(LogUsedSize),
        Total: Number(LogTotalSize),
        UsagePercent: (Number(LogUsedSize) * 100) / Number(LogTotalSize),
    };

    const preparedVDisks = WhiteboardVDisksData.map(prepareVDiskData);

    const vdisksSlots: SlotItem[] = preparedVDisks.map((preparedVDisk) => {
        return {
            SlotType: 'vDisk',
            Id: preparedVDisk.VDiskId?.GroupID,
            Title: preparedVDisk.StoragePoolName,
            Severity: preparedVDisk.Severity,
            Used: Number(preparedVDisk.AllocatedSize),
            Total: Number(preparedVDisk.TotalSize),
            UsagePercent: preparedVDisk.AllocatedPercent,

            VDiskData: preparedVDisk,
        };
    });

    const diskSlots = [...vdisksSlots, logSlot];

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

        diskSlots.push(
            ...getArray(emptySlotsCount).map((): SlotItem => {
                return {
                    SlotType: 'empty',
                    Total: emptySlotSize,
                };
            }),
        );
    }

    const rawNode = nodeResponse.SystemStateInfo?.[0];
    const preparedNode = prepareNodeSystemState(rawNode);

    return {
        ...preparedPDisk,
        NodeId: preparedPDisk.NodeId ?? preparedNode.NodeId,
        NodeHost: preparedNode.Host,
        NodeType: preparedNode.Roles?.[0],
        NodeDC: preparedNode.DC,
        SlotItems: diskSlots,
    };
}

export function preparePDiskStorageResponse(
    data: TStorageInfo,
    pDiskId: number | string,
    nodeId: number | string,
) {
    const preparedGroups: PreparedStorageGroup[] = [];

    data.StoragePools?.forEach((pool) =>
        pool.Groups?.forEach((group) => {
            const groupHasPDiskVDisks = group.VDisks?.some((vdisk) => {
                // If VDisk has PDisk inside, PDiskId and NodeId fields could be only inside PDisk and vice versa
                const groupPDiskId = vdisk.PDiskId ?? vdisk.PDisk?.PDiskId;
                const groupNodeId = vdisk.NodeId ?? vdisk.PDisk?.NodeId;

                return groupPDiskId === Number(pDiskId) && groupNodeId === Number(nodeId);
            });

            if (groupHasPDiskVDisks) {
                preparedGroups.push(prepareStorageGroupData(group, pool));
            }
        }),
    );

    return preparedGroups;
}
