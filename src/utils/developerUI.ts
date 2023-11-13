import {backend} from '../store';
import {pad9} from './utils';

// Current node connects with target node by itself using nodeId
export const createDeveloperUILinkWithNodeId = (nodeId: number | string) => {
    return `${backend}/node/${nodeId}/`;
};

interface PDiskDeveloperUILinkParams {
    nodeId: number | string;
    pDiskId: number | string;
}

export const createPDiskDeveloperUILink = ({nodeId, pDiskId}: PDiskDeveloperUILinkParams) => {
    const pdiskPath = 'actors/pdisks/pdisk' + pad9(pDiskId);

    return createDeveloperUILinkWithNodeId(nodeId) + pdiskPath;
};

interface VDiskDeveloperUILinkParams extends PDiskDeveloperUILinkParams {
    vDiskSlotId: number | string;
}

export const createVDiskDeveloperUILink = ({
    nodeId,
    pDiskId,
    vDiskSlotId,
}: VDiskDeveloperUILinkParams) => {
    const vdiskPath = 'actors/vdisks/vdisk' + pad9(pDiskId) + '_' + pad9(vDiskSlotId);

    return createDeveloperUILinkWithNodeId(nodeId) + vdiskPath;
};
