import {getVDiskPagePath} from '../../routes';
import type {PreparedVDisk} from '../../utils/disks/types';

export function getVDiskLink(data: PreparedVDisk, query: {database: string | undefined}) {
    return getVDiskPagePath(
        {
            vDiskSlotId: data.VDiskSlotId,
            pDiskId: data.PDiskId,
            nodeId: data.NodeId,
            groupId: data.VDiskId?.GroupID,
            vDiskId: data.StringifiedId,
        },
        query,
    );
}
