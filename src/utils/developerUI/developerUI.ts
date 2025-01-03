import {backend} from '../../store';
import {pad9} from '../utils';

export function createDeveloperUIInternalPageHref(host = backend) {
    return host + '/internal';
}

export function createDeveloperUIMonitoringPageHref(host = backend) {
    return host + '/monitoring';
}

// Current node connects with target node by itself using nodeId
export const createDeveloperUILinkWithNodeId = (nodeId: number | string, host = backend) => {
    const nodePathRegexp = /\/node\/\d+\/?$/g;

    // In case current backend is already relative node path ({host}/node/{nodeId})
    // We replace existing nodeId path with new nodeId path
    if (nodePathRegexp.test(String(host))) {
        return String(host).replace(nodePathRegexp, `/node/${nodeId}`);
    }

    return `${host ?? ''}/node/${nodeId}`;
};

interface PDiskDeveloperUILinkParams {
    nodeId: number | string;
    pDiskId: number | string;
    host?: string;
}

export const createPDiskDeveloperUILink = ({nodeId, pDiskId, host}: PDiskDeveloperUILinkParams) => {
    const pdiskPath = '/actors/pdisks/pdisk' + pad9(pDiskId);

    return createDeveloperUILinkWithNodeId(nodeId, host) + pdiskPath;
};

interface VDiskDeveloperUILinkParams extends PDiskDeveloperUILinkParams {
    vDiskSlotId: number | string;
}

export const createVDiskDeveloperUILink = ({
    nodeId,
    pDiskId,
    vDiskSlotId,
    host,
}: VDiskDeveloperUILinkParams) => {
    const vdiskPath = '/actors/vdisks/vdisk' + pad9(pDiskId) + '_' + pad9(vDiskSlotId);

    return createDeveloperUILinkWithNodeId(nodeId, host) + vdiskPath;
};

export function createTabletDeveloperUIHref(
    tabletId: number | string,
    tabletPage?: string,
    searchParam = 'TabletID',
    host = backend,
) {
    const subPage = tabletPage ? `/${tabletPage}` : '';
    return `${host}/tablets${subPage}?${searchParam}=${tabletId}`;
}
