import type {TEvPDiskStateResponse} from '../../../types/api/pdisk';
import type {TStorageInfo} from '../../../types/api/storage';
import type {TEvSystemStateResponse} from '../../../types/api/systemState';
import {preparePDiskData} from '../../../utils/disks/prepareDisks';
import {prepareNodeSystemState} from '../../../utils/nodes';
import type {PreparedStorageGroup} from '../storage/types';
import {prepareStorageGroupData} from '../storage/utils';

export function preparePDiksDataResponse([pdiskResponse, nodeResponse]: [
    TEvPDiskStateResponse,
    TEvSystemStateResponse,
]) {
    const rawPDisk = pdiskResponse.PDiskStateInfo?.[0];
    const preparedPDisk = preparePDiskData(rawPDisk);

    const rawNode = nodeResponse.SystemStateInfo?.[0];
    const preparedNode = prepareNodeSystemState(rawNode);

    return {
        ...preparedPDisk,
        NodeId: preparedPDisk.NodeId ?? preparedNode.NodeId,
        NodeHost: preparedNode.Host,
        NodeType: preparedNode.Roles?.[0],
        NodeDC: preparedNode.DC,
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
