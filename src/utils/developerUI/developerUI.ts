import {uiFactory} from '../../uiFactory/uiFactory';
import {useIsUserAllowedToMakeChanges} from '../hooks/useIsUserAllowedToMakeChanges';
import {pad9} from '../utils';

function getCurrentHost() {
    // It always has correct backend
    return window.api.viewer.getPath('');
}

export function createDeveloperUIInternalPageHref(host = getCurrentHost()) {
    return host + '/internal';
}

export function createDeveloperUIMonitoringPageHref(host = getCurrentHost()) {
    return host + '/monitoring';
}

// Current node connects with target node by itself using nodeId
export const createDeveloperUILinkWithNodeId = (
    nodeId: number | string,
    host = getCurrentHost(),
) => {
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
    return isUserAllowedToMakeChanges && isDeveloperUiAllowed;
}
