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
        ({VDiskId, Donors}) =>
            VDiskId === vDiskId || Donors?.some(({VDiskId: donorId}) => donorId === vDiskId),
    );

    const preparedVDisk = prepareGroupsVDisk(rawVDisk);

    let currentVDisk: VDiskData = {};

    if (preparedVDisk.StringifiedId === vDiskId) {
        currentVDisk = preparedVDisk;
    } else {
        for (const donor of preparedVDisk.Donors ?? []) {
            if (donor.StringifiedId === vDiskId) {
                // Keep the recipient's metrics without a back-reference to this donor.
                const {Donors: _donors, ...recipient} = preparedVDisk;
                currentVDisk = {...donor, Recipient: recipient};
                break;
            }
        }
    }

    const preparedPDisk = currentVDisk.PDisk;

    const rawNode = nodeResponse?.SystemStateInfo?.[0];
    const preparedNode = prepareNodeSystemState(rawNode);

    const NodeId = currentVDisk.NodeId ?? preparedPDisk?.NodeId ?? preparedNode.NodeId;
    const NodeHost = preparedNode.Host;
    const NodeDC = preparedNode.DC;
    const NodeRack = preparedNode.Rack;

    const PDiskId = currentVDisk.PDiskId ?? preparedPDisk?.PDiskId;
    const PDiskType = preparedPDisk?.Type;

    return {
        ...currentVDisk,

        NodeId,
        NodeHost,
        NodeDC,
        NodeRack,

        PDiskId,
        PDiskType,
    };
}
