import {getVDiskPagePath} from '../../routes';
import type {PreparedVDisk} from '../../utils/disks/types';

export function getVDiskLink(data: PreparedVDisk, query: {database: string | undefined}) {
    if (!data.StringifiedId) {
        return undefined;
    }
    return getVDiskPagePath(
        {
            nodeId: data.NodeId,
            vDiskId: data.StringifiedId,
        },
        query,
    );
}
