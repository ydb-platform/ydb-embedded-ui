import type {Location} from 'history';
import isEmpty from 'lodash/isEmpty';
import {compile} from 'path-to-regexp';
import qs from 'qs';
import type {QueryParamConfig} from 'use-query-params';
import {StringParam} from 'use-query-params';

import {backend, basename, clusterName, webVersion} from './store';
import {normalizePathSlashes} from './utils';

export const CLUSTERS = 'clusters';
export const CLUSTER = 'cluster';
export const TENANT = 'tenant';
export const NODE = 'node';
export const PDISK = 'pDisk';
export const VDISK = 'vDisk';
export const STORAGE_GROUP = 'storageGroup';
export const TABLET = 'tablet';

const routes = {
    clusters: `/${CLUSTERS}`,
    cluster: `/${CLUSTER}/:activeTab?`,
    tenant: `/${TENANT}`,
    node: `/${NODE}/:id/:activeTab?`,
    pDisk: `/${PDISK}`,
    vDisk: `/${VDISK}`,
    storageGroup: `/${STORAGE_GROUP}`,
    tablet: `/${TABLET}/:id`,
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

type Query = AnyRecord;

export interface CreateHrefOptions {
    withBasename?: boolean;
}

export function createHref(
    route: string,
    params?: Record<string, string | number | undefined>,
    query: Query = {},
    options: CreateHrefOptions = {},
) {
    let extendedQuery = query;

    const isBackendInQuery = 'backend' in query && Boolean(query.backend);
    if (backend && !isBackendInQuery && webVersion) {
        extendedQuery = {...query, backend};
    }

    const isClusterNameInQuery = 'clusterName' in query && Boolean(query.clusterName);
    if (clusterName && !isClusterNameInQuery && webVersion) {
        extendedQuery = {...extendedQuery, clusterName};
    }

    const search = isEmpty(extendedQuery)
        ? ''
        : `?${qs.stringify(extendedQuery, {encode: false, arrayFormat: 'repeat'})}`;

    const preparedRoute = prepareRoute(route);

    const compiledRoute = `${compile(preparedRoute)(params)}${search}`;

    if (options.withBasename && basename) {
        // For SPA links react-router adds basename itself
        // It is needed for external links - <a> or uikit <Link>
        return normalizePathSlashes(`${basename}/${compiledRoute}`);
    }
    return compiledRoute;
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

// ==== Get page path functions ====

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryParamsTypeFromQueryObject<T extends Record<string, QueryParamConfig<any, any>>> = {
    [QueryParamName in keyof T]?: Parameters<T[QueryParamName]['encode']>[0];
};

export function getPDiskPagePath(
    pDiskId: string | number,
    nodeId: string | number,
    query: Query = {},
) {
    return createHref(routes.pDisk, undefined, {...query, nodeId, pDiskId});
}

export function getVDiskPagePath(
    params: {
        nodeId: string | number | undefined;
        vDiskId: string;
    },
    query: {database: string | undefined; activeTab?: string} = {database: undefined},
) {
    return createHref(routes.vDisk, undefined, {...query, ...params});
}

export function getStorageGroupPath(groupId: string | number, query: Query = {}) {
    return createHref(routes.storageGroup, undefined, {...query, groupId});
}

export const tabletPageQueryParams = {
    database: StringParam,
    clusterName: StringParam,
    activeTab: StringParam,
    followerId: StringParam,
} as const;

type TabletPageQuery = QueryParamsTypeFromQueryObject<typeof tabletPageQueryParams>;

export function getTabletPagePath(tabletId: string | number, query: TabletPageQuery = {}) {
    return createHref(routes.tablet, {id: tabletId}, {...query});
}
