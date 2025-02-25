import {backend} from '../../store';
import {pad9} from '../utils';

export function createDeveloperUIInternalPageHref(host = backend, database?: string) {
    const queryParams = getDatabaseQueryString(database);
    return host + '/internal' + queryParams;
}

export function createDeveloperUIMonitoringPageHref(host = backend) {
    return host + '/monitoring';
}

function getDatabaseQueryString(database?: string) {
    const params = new URLSearchParams();
    if (database) {
        params.set('database', database);
    }
    const paramsString = params.toString();
    return paramsString ? '?' + paramsString : '';
}

export function createBaseDeveloperUILinkWithNodeId(nodeId: number | string, host = backend) {
    const nodePathRegexp = /\/node\/\d+\/?$/g;

    // In case current backend is already relative node path ({host}/node/{nodeId})
    // We replace existing nodeId path with new nodeId path
    if (nodePathRegexp.test(String(host))) {
        return String(host).replace(nodePathRegexp, `/node/${nodeId}`);
    }

    return `${host ?? ''}/node/${nodeId}`;
}

// Current node connects with target node by itself using nodeId
export const createDeveloperUILinkWithNodeId = (
    nodeId: number | string,
    host = backend,
    database?: string,
) => {
    const href = createBaseDeveloperUILinkWithNodeId(nodeId, host);

    const queryParams = getDatabaseQueryString(database);

    return `${href}${queryParams}`;
};

interface PDiskDeveloperUILinkParams {
    nodeId: number | string;
    pDiskId: number | string;
    host?: string;
    database?: string;
}

export const createPDiskDeveloperUILink = ({
    nodeId,
    pDiskId,
    host,
    database,
}: PDiskDeveloperUILinkParams) => {
    const queryParams = getDatabaseQueryString(database);

    const pdiskPath = '/actors/pdisks/pdisk' + pad9(pDiskId) + queryParams;

    return createBaseDeveloperUILinkWithNodeId(nodeId, host) + pdiskPath;
};

interface VDiskDeveloperUILinkParams extends PDiskDeveloperUILinkParams {
    vDiskSlotId: number | string;
}

export const createVDiskDeveloperUILink = ({
    nodeId,
    pDiskId,
    vDiskSlotId,
    host,
    database,
}: VDiskDeveloperUILinkParams) => {
    const queryParams = getDatabaseQueryString(database);

    const vdiskPath =
        '/actors/vdisks/vdisk' + pad9(pDiskId) + '_' + pad9(vDiskSlotId) + queryParams;

    return createBaseDeveloperUILinkWithNodeId(nodeId, host) + vdiskPath;
};

export function createTabletDeveloperUIHref(
    tabletId: number | string,
    database?: string,
    tabletPage?: string,
    searchParam = 'TabletID',
    host = backend,
) {
    const subPage = tabletPage ? `/${tabletPage}` : '';
    const params = new URLSearchParams();
    params.set(searchParam, String(tabletId));
    if (database) {
        params.set('database', database);
    }
    return `${host}/tablets${subPage}?${params.toString()}`;
}
