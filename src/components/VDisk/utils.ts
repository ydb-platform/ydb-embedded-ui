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
        vDiskPath = getVDiskPagePath(data.VDiskSlotId, data.PDiskId, data.NodeId);
    } else if (valueIsDefined(data.StringifiedId)) {
        vDiskPath = getVDiskPagePath(
            undefined as unknown as string,
            data.PDiskId as number,
            data.NodeId as number,
            {
                vDiskId: data.StringifiedId,
            },
        );
    }

    return vDiskPath;
}
