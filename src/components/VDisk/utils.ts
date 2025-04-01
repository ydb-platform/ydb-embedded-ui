import {isNil} from 'lodash';

import {getDefaultNodePath} from '../../containers/Node/NodePages';
import {getVDiskPagePath} from '../../routes';
import type {TVDiskStateInfo, TVSlotId} from '../../types/api/vdisk';
import {stringifyVdiskId} from '../../utils/dataFormatters/dataFormatters';
import {isFullVDiskData} from '../../utils/disks/helpers';

export function getVDiskLink(data: TVDiskStateInfo | TVSlotId) {
    let vDiskPath: string | undefined;

    const isFullData = isFullVDiskData(data);
    const VDiskSlotId = isFullData ? data.VDiskSlotId : data.VSlotId;

    if (!isNil(VDiskSlotId) && !isNil(data.PDiskId) && !isNil(data.NodeId)) {
        vDiskPath = getVDiskPagePath(VDiskSlotId, data.PDiskId, data.NodeId);
    } else if (!isNil(data.NodeId) && isFullVDiskData(data)) {
        vDiskPath = getDefaultNodePath(
            data.NodeId,
            {
                pdiskId: data.PDiskId?.toString(),
                vdiskId: stringifyVdiskId(data.VDiskId),
            },
            'structure',
        );
    }

    return vDiskPath;
}
