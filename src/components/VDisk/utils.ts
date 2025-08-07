import {getVDiskPagePath} from '../../routes';
import type {PreparedVDisk} from '../../utils/disks/types';

export function getVDiskLink(data: PreparedVDisk, query: {database: string | undefined}) {
    return getVDiskPagePath(
        {
            pDiskId: data.PDiskId,
            nodeId: data.NodeId,
            vDiskId: data.StringifiedId,
        },
        query,
    );
}
