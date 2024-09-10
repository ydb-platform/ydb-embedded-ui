import type {TEvPDiskStateResponse} from '../../../types/api/pdisk';
import type {TEvSystemStateResponse} from '../../../types/api/systemState';
import type {TEvVDiskStateResponse} from '../../../types/api/vdisk';
import {preparePDiskData, prepareVDiskData} from '../../../utils/disks/prepareDisks';
import {prepareNodeSystemState} from '../../../utils/nodes';

import type {VDiskData} from './types';

export function prepareVDiskDataResponse([vDiskResponse, pDiskResponse, nodeResponse]: [
    TEvVDiskStateResponse,
    TEvPDiskStateResponse,
    TEvSystemStateResponse,
]): VDiskData {
    const rawVDisk = vDiskResponse.VDiskStateInfo?.[0];
    const preparedVDisk = prepareVDiskData(rawVDisk);

    const rawPDisk = pDiskResponse.PDiskStateInfo?.[0];
    const preparedPDisk = preparePDiskData(rawPDisk);

    const rawNode = nodeResponse.SystemStateInfo?.[0];
    const preparedNode = prepareNodeSystemState(rawNode);

    const NodeId = preparedVDisk.NodeId ?? preparedPDisk.NodeId ?? preparedNode.NodeId;
    const NodeHost = preparedNode.Host;
    const NodeType = preparedNode.Roles?.[0];
    const NodeDC = preparedNode.DC;

    const PDiskId = preparedVDisk.PDiskId ?? preparedPDisk.PDiskId;
    const PDiskType = preparedPDisk.Type;

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
