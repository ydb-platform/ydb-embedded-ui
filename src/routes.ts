import type {Location} from 'history';
import qs from 'qs';
import {compile} from 'path-to-regexp';
import isEmpty from 'lodash/isEmpty';

import {backend, clusterName, webVersion} from './store';

export const CLUSTERS = 'clusters';
export const CLUSTER = 'cluster';
export const TENANT = 'tenant';
export const NODE = 'node';
export const PDISK = 'pDisk';
export const VDISK = 'vDisk';
export const TABLET = 'tablet';

const routes = {
    clusters: `/${CLUSTERS}`,
    cluster: `/${CLUSTER}/:activeTab?`,
    tenant: `/${TENANT}`,
    node: `/${NODE}/:id/:activeTab?`,
    pDisk: `/${PDISK}`,
    vDisk: `/${VDISK}`,
    tablet: `/${TABLET}/:id`,
    tabletsFilters: `/tabletsFilters`,
    auth: `/auth`,
} as const;

export default routes;

export const parseQuery = (location: Location) => {
    return qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });
};

const prepareRoute = (route: string) => {
    let preparedRoute = route;
    const portRegExp = /:\d{3,5}/g;
    const portMatch = route.match(portRegExp);

    // if port exists in route we escape port to avoid errors in function compile()
    // compile(preparedRoute) parses prepared root by symbol ":"
    // if we pass raw route and there is a port in route, compile()
    // will try to parse the port and throw an error
    if (portMatch) {
        const port = portMatch[0];
        preparedRoute = route.replace(portRegExp, ':\\' + port.slice(1));
    }

    return preparedRoute;
};

export type Query = Record<string | number, string | number | string[] | number[] | undefined>;

export function createHref(
    route: string,
    params?: Record<string, string | number>,
    query: Query = {},
) {
    let extendedQuery = query;

    const isBackendInQuery = Boolean(query.backend);
    if (backend && !isBackendInQuery && webVersion) {
        extendedQuery = {...query, backend};
    }

    const isClusterNameInQuery = Boolean(query.clusterName);
    if (clusterName && !isClusterNameInQuery && webVersion) {
        extendedQuery = {...extendedQuery, clusterName};
    }

    const search = isEmpty(extendedQuery) ? '' : `?${qs.stringify(extendedQuery, {encode: false})}`;

    const preparedRoute = prepareRoute(route);

    return `${compile(preparedRoute)(params)}${search}`;
}

// embedded version could be located in some folder (e.g. host/some_folder/app_router_path)
// window.location has the full pathname, while location from router ignores path to project
// this navigation assumes page reloading
export const createExternalUILink = (query = {}) =>
    createHref(window.location.pathname, undefined, query);

export function getLocationObjectFromHref(href: string) {
    const {pathname, search, hash} = new URL(href, 'http://localhost');
    return {pathname, search, hash};
}

export function getPDiskPagePath(
    pDiskId: string | number,
    nodeId: string | number,
    query: Query = {},
) {
    return createHref(routes.pDisk, undefined, {...query, nodeId, pDiskId});
}

export function getVDiskPagePath(
    vDiskSlotId: string | number,
    pDiskId: string | number,
    nodeId: string | number,
    query: Query = {},
) {
    return createHref(routes.vDisk, undefined, {...query, nodeId, pDiskId, vDiskSlotId});
}
