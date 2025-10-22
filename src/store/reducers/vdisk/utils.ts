import type {StorageGroupsResponse} from '../../../types/api/storage';
import type {TEvSystemStateResponse} from '../../../types/api/systemState';
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
        ({VDiskId}) => VDiskId === vDiskId,
    );

    const preparedVDisk = prepareGroupsVDisk(rawVDisk);
    const preparedPDisk = preparedVDisk.PDisk;

    const rawNode = nodeResponse?.SystemStateInfo?.[0];
    const preparedNode = prepareNodeSystemState(rawNode);

    const NodeId = preparedVDisk.NodeId ?? preparedPDisk?.NodeId ?? preparedNode.NodeId;
    const NodeHost = preparedNode.Host;
    const NodeType = preparedNode.Roles?.[0];
    const NodeDC = preparedNode.DC;

    const PDiskId = preparedVDisk.PDiskId ?? preparedPDisk?.PDiskId;
    const PDiskType = preparedPDisk?.Type;

    return {
        ...preparedVDisk,

        NodeId,
        NodeHost,
        NodeType,
        NodeDC,

        PDiskId,
        PDiskType,
    };
}
