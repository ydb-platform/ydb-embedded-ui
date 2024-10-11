import {STRUCTURE} from '../../containers/Node/NodePages';
import routes, {createHref, getVDiskPagePath} from '../../routes';
import type {TVDiskStateInfo, TVSlotId} from '../../types/api/vdisk';
import {valueIsDefined} from '../../utils';
import {stringifyVdiskId} from '../../utils/dataFormatters/dataFormatters';
import {isFullVDiskData} from '../../utils/disks/helpers';

export function getVDiskLink(data: TVDiskStateInfo | TVSlotId) {
    let vDiskPath: string | undefined;

    const isFullData = isFullVDiskData(data);
    const VDiskSlotId = isFullData ? data.VDiskSlotId : data.VSlotId;

    if (
        valueIsDefined(VDiskSlotId) &&
        valueIsDefined(data.PDiskId) &&
        valueIsDefined(data.NodeId)
    ) {
        vDiskPath = getVDiskPagePath(VDiskSlotId, data.PDiskId, data.NodeId);
    } else if (valueIsDefined(data.NodeId) && isFullVDiskData(data)) {
        vDiskPath = createHref(
            routes.node,
            {id: data.NodeId, activeTab: STRUCTURE},
            {
                pdiskId: data.PDiskId,
                vdiskId: stringifyVdiskId(data.VDiskId),
            },
        );
    }

    return vDiskPath;
}
