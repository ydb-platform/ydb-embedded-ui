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

    data.StoragePools?.forEach((pool) => {
        pool.Groups?.filter((group) => {
            if (!group?.VDisks) {
                return false;
            }

            return (
                group.VDisks.filter(
                    (vdisk) =>
                        (vdisk.PDiskId === pDiskId || vdisk.PDisk?.PDiskId === Number(pDiskId)) &&
                        vdisk.PDisk?.NodeId === Number(nodeId),
                ).length > 0
            );
        }).forEach((group) => {
            preparedGroups.push(prepareStorageGroupData(group, pool.Name));
        });
    });

    return preparedGroups;
}
