import {getVDiskPagePath} from '../../routes';
import {valueIsDefined} from '../../utils';
import type {PreparedVDisk} from '../../utils/disks/types';

export function getVDiskLink(data: PreparedVDisk) {
    let vDiskPath: string | undefined;

    if (
        valueIsDefined(data.VDiskSlotId) &&
        valueIsDefined(data.PDiskId) &&
        valueIsDefined(data.NodeId)
    ) {
        vDiskPath = getVDiskPagePath({
            vDiskSlotId: data.VDiskSlotId,
            pDiskId: data.PDiskId,
            nodeId: data.NodeId,
            vDiskId: data.StringifiedId,
        });
    } else if (valueIsDefined(data.StringifiedId)) {
        vDiskPath = getVDiskPagePath({
            vDiskId: data.StringifiedId,
            pDiskId: data.PDiskId,
            nodeId: data.NodeId,
        });
    }

    return vDiskPath;
}
