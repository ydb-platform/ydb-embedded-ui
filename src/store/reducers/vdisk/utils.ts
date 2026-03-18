import type {StorageGroupsResponse} from '../../../types/api/storage';
import type {TEvSystemStateResponse} from '../../../types/api/systemState';
import type {PreparedVDisk} from '../../../utils/disks/types';
import {prepareNodeSystemState} from '../../../utils/nodes';
import {prepareGroupsVDisk} from '../storage/prepareGroupsDisks';

import type {VDiskData} from './types';

export function prepareVDiskDataResponse(
    [storageGroupResponse, nodeResponse]: [
        StorageGroupsResponse,
        TEvSystemStateResponse | undefined,
    ],
    vDiskId: string,
): VDiskData {
    const rawVDisk = storageGroupResponse?.StorageGroups?.[0].VDisks?.find(
        ({VDiskId, Donors}) =>
            VDiskId === vDiskId || Donors?.some(({VDiskId: donorId}) => donorId === vDiskId),
    );

    const preparedVDisk = prepareGroupsVDisk(rawVDisk);

    let currentVDisk: PreparedVDisk = {};

    if (preparedVDisk.StringifiedId === vDiskId) {
        currentVDisk = preparedVDisk;
    } else {
        for (const donor of preparedVDisk.Donors ?? []) {
            if (donor.StringifiedId === vDiskId) {
                currentVDisk = donor;
                currentVDisk.Recipient = {
                    NodeId: preparedVDisk.NodeId,
                    StringifiedId: preparedVDisk.StringifiedId,
                };
                break;
            }
        }
    }

    const preparedPDisk = currentVDisk.PDisk;

    const rawNode = nodeResponse?.SystemStateInfo?.[0];
    const preparedNode = prepareNodeSystemState(rawNode);

    const NodeId = currentVDisk.NodeId ?? preparedPDisk?.NodeId ?? preparedNode.NodeId;
    const NodeHost = preparedNode.Host;
    const NodeType = preparedNode.Roles?.[0];
    const NodeDC = preparedNode.DC;

    const PDiskId = currentVDisk.PDiskId ?? preparedPDisk?.PDiskId;
    const PDiskType = preparedPDisk?.Type;

    return {
        ...currentVDisk,

        NodeId,
        NodeHost,
        NodeType,
        NodeDC,

        PDiskId,
        PDiskType,
    };
}
