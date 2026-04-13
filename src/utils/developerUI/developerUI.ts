import {uiFactory} from '../../uiFactory/uiFactory';
import {useIsUserAllowedToMakeChanges} from '../hooks/useIsUserAllowedToMakeChanges';
import {pad9} from '../utils';

function appendPathSegment(host: string, firstSegment: string) {
    const normalizedFirstSegment = firstSegment.replace(/^\/+|\/+$/g, '');
    const normalizedHost = host.replace(/\/+$/g, '');

    if (!normalizedFirstSegment) {
        return normalizedHost || host;
    }

    if (!normalizedHost) {
        return `/${normalizedFirstSegment}`;
    }

    return `${normalizedHost}/${normalizedFirstSegment}`;
}

function getCurrentHost() {
    // It always has correct backend
    const host = String(window.api.viewer.getPath(''));
    const firstSegment = uiFactory.developerUiFirstPathSegment;

    if (!firstSegment) {
        return host;
    }

    return appendPathSegment(host, firstSegment);
}

function replaceNodePath(host: string, replacement = '') {
    return host.replace(/\/node\/\d+\/?$/, replacement);
}

export function createDeveloperUIInternalPageHref(host = getCurrentHost()) {
    return host + '/internal';
}

export function createDeveloperUIMonitoringPageHref(host = getCurrentHost()) {
    return host + '/monitoring';
}

// Current node connects with target node by itself using nodeId
export const createDeveloperUILinkWithNodeId = (nodeId: number | string, host?: string) => {
    const nodePath = `/node/${nodeId}`;

    if (host !== undefined) {
        return `${replaceNodePath(host)}${nodePath}`;
    }

    // When using current host, strip any existing /node/{id} before appending firstSegment
    const rawHost = window.api.viewer.getPath('');
    const baseHost = replaceNodePath(rawHost);
    const firstSegment = uiFactory.developerUiFirstPathSegment;

    const hostWithSegment = firstSegment ? appendPathSegment(baseHost, firstSegment) : baseHost;

    return `${hostWithSegment}${nodePath}`;
};

interface PDiskDeveloperUILinkParams {
    nodeId: number | string;
    pDiskId: number | string;
}

export const createPDiskDeveloperUILink = ({nodeId, pDiskId}: PDiskDeveloperUILinkParams) => {
    const pdiskPath = '/actors/pdisks/pdisk' + pad9(pDiskId);

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
    const vdiskPath = '/actors/vdisks/vdisk' + pad9(pDiskId) + '_' + pad9(vDiskSlotId);

    return createDeveloperUILinkWithNodeId(nodeId) + vdiskPath;
};

export function createTabletDeveloperUIHref(
    tabletId: number | string,
    tabletPage?: string,
    searchParam = 'TabletID',
    host = getCurrentHost(),
) {
    const subPage = tabletPage ? `/${tabletPage}` : '';
    return `${host}/tablets${subPage}?${searchParam}=${tabletId}`;
}

export function useHasDeveloperUi() {
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();
    const isDeveloperUiAllowed = uiFactory.hasDeveloperUi;
    return Boolean(isUserAllowedToMakeChanges && isDeveloperUiAllowed);
}
