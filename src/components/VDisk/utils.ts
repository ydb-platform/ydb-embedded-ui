import {getDefaultNodePath} from '../../containers/Node/NodePages';
import {getVDiskPagePath} from '../../routes';
import type {TVDiskStateInfo, TVSlotId} from '../../types/api/vdisk';
import {valueIsDefined} from '../../utils';
import {stringifyVdiskId} from '../../utils/dataFormatters/dataFormatters';
import {isFullVDiskData} from '../../utils/disks/helpers';

export function getVDiskLink(data: TVDiskStateInfo | TVSlotId, database?: string) {
    let vDiskPath: string | undefined;

    const isFullData = isFullVDiskData(data);
    const VDiskSlotId = isFullData ? data.VDiskSlotId : data.VSlotId;

    if (
        valueIsDefined(VDiskSlotId) &&
        valueIsDefined(data.PDiskId) &&
        valueIsDefined(data.NodeId)
    ) {
        vDiskPath = getVDiskPagePath(VDiskSlotId, data.PDiskId, data.NodeId, {database});
    } else if (valueIsDefined(data.NodeId) && isFullVDiskData(data)) {
        vDiskPath = getDefaultNodePath(
            data.NodeId,
            {
                pdiskId: data.PDiskId?.toString(),
                vdiskId: stringifyVdiskId(data.VDiskId),
                database,
            },
            'structure',
        );
    }

    return vDiskPath;
}
