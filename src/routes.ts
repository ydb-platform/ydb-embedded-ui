import React from 'react';

import type {Location} from 'history';
import isEmpty from 'lodash/isEmpty';
import {compile, match} from 'path-to-regexp';
import qs from 'qs';
import type {QueryParamConfig} from 'use-query-params';
import {StringParam} from 'use-query-params';
import {z} from 'zod';

import type {ClusterTab} from './containers/Cluster/utils';
import type {NodePageQuery, NodeTab} from './containers/Node/NodePages';
import type {TenantQuery} from './containers/Tenant/TenantPages';
import {backend, basename, clusterName, environment, webVersion} from './store';
import {uiFactory} from './uiFactory/uiFactory';
import {normalizePathSlashes} from './utils';
import {useDatabaseFromQuery} from './utils/hooks/useDatabaseFromQuery';

export const CLUSTER = 'cluster';
export const TENANT = 'tenant';
export const NODE = 'node';
export const PDISK = 'pDisk';
export const VDISK = 'vDisk';
export const STORAGE_GROUP = 'storageGroup';
export const TABLET = 'tablet';

const routes = {
    homePage: `/home/:activeTab?`,
    cluster: `/:environment?/${CLUSTER}/:activeTab?`,
    tenant: `/:environment?/${TENANT}`,
    node: `/:environment?/${NODE}/:id/:activeTab?`,
    pDisk: `/:environment?/${PDISK}`,
    vDisk: `/:environment?/${VDISK}`,
    storageGroup: `/:environment?/${STORAGE_GROUP}`,
    tablet: `/:environment?/${TABLET}/:id`,
    auth: `/:environment?/auth`,
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

// eslint-disable-next-line complexity
export function createHref(
    route: string,
    params?: Record<string, string | number | undefined>,
    query: Query = {},
    options: CreateHrefOptions = {},
    domain = '',
) {
    let extendedQuery = query;
    let extendedParams = params ?? {};

    // if {backend: ""} or {clusterName: ""} in query - it means we want to reset it
    const isBackendInQuery = typeof query?.backend === 'string';
    const isClusterNameInQuery = typeof query?.clusterName === 'string';

    // Set params to undefined to prevent backend= and clusterName= in query
    if (isBackendInQuery && !query.backend) {
        extendedQuery = {...extendedQuery, backend: undefined};
    }
    if (isClusterNameInQuery && !query.clusterName) {
        extendedQuery = {...extendedQuery, clusterName: undefined};
    }

    if (backend && !isBackendInQuery && webVersion) {
        extendedQuery = {...query, backend};
    }
    if (clusterName && !isClusterNameInQuery && webVersion) {
        extendedQuery = {...extendedQuery, clusterName};
    }

    // if {environment: ""} in params - it means we want to reset it
    const isEnvironmentInParams = typeof params?.environment === 'string';

    if (webVersion && environment && !isEnvironmentInParams) {
        extendedParams = {...extendedParams, environment};
    }

    const search = isEmpty(extendedQuery)
        ? ''
        : `?${qs.stringify(extendedQuery, {encode: false, arrayFormat: 'repeat'})}`;

    const preparedRoute = prepareRoute(route);

    const compiledRoute = `${compile(preparedRoute)(extendedParams)}${search}`;

    if (options.withBasename && basename) {
        // For SPA links react-router adds basename itself
        // It is needed for external links - <a> or uikit <Link>
        return normalizePathSlashes(`${domain}${basename}/${compiledRoute}`);
    }

    return `${domain}${compiledRoute}`;
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

export type BaseQueryParams = {
    clusterName?: string;
    backend?: string;
};

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

export function getStorageGroupPath(groupId: string | number, query: Query = {}) {
    return createHref(routes.storageGroup, undefined, {...query, groupId});
}

export function getDefaultNodePath(
    params: {id: string | number; activeTab?: NodeTab},
    query: NodePageQuery = {},
    options?: CreateHrefOptions,
) {
    return createHref(routes.node, params, query, options);
}

export const getClusterPath = (
    params?: {activeTab?: ClusterTab; environment?: string},
    query = {},
    options?: CreateHrefOptions,
    domain?: string,
) => {
    return createHref(routes.cluster, params, query, options, domain);
};

export const getTenantPath = (query: TenantQuery, options?: CreateHrefOptions) => {
    return createHref(routes.tenant, undefined, query, options);
};

export const homePageTabSchema = z.enum(['clusters', 'databases']);
export type HomePageTab = z.infer<typeof homePageTabSchema>;

type HomePageQueryParams = BaseQueryParams & {
    env?: string;
};

export function getHomePagePath(
    params?: {activeTab?: HomePageTab},
    query?: HomePageQueryParams,
    options?: CreateHrefOptions,
) {
    const isCLustersTab = params?.activeTab === 'clusters';
    const clustersDomain = isCLustersTab ? uiFactory.clustersDomain : undefined;
    return createHref(routes.homePage, params, query, options, clustersDomain);
}
export function getDatabasesPath(query?: HomePageQueryParams, options?: CreateHrefOptions) {
    return getHomePagePath({activeTab: 'databases'}, query, options);
}
export function getClustersPath(query?: HomePageQueryParams, options?: CreateHrefOptions) {
    return getHomePagePath({activeTab: 'clusters'}, query, options);
}

export const tabletPageQueryParams = {
    database: StringParam,
    clusterName: StringParam,
    activeTab: StringParam,
    followerId: StringParam,
} as const;

type TabletPageQuery = QueryParamsTypeFromQueryObject<typeof tabletPageQueryParams>;

export function useVDiskPagePath() {
    const database = useDatabaseFromQuery();

    return React.useCallback(
        (
            params: {
                nodeId: string | number | undefined;
                vDiskId: string | undefined;
            },
            query: {activeTab?: string} = {},
        ) => {
            if (!params.vDiskId) {
                return undefined;
            }
            return createHref(routes.vDisk, undefined, {...query, ...params, database});
        },
        [database],
    );
}

export function useStorageGroupPath() {
    const database = useDatabaseFromQuery();

    return React.useCallback(
        (groupId: string | number, query: Query = {}) => {
            return createHref(routes.storageGroup, undefined, {...query, groupId, database});
        },
        [database],
    );
}

export function useTabletPagePath() {
    const database = useDatabaseFromQuery();

    return React.useCallback(
        (tabletId: string | number, query: TabletPageQuery = {}) => {
            return createHref(routes.tablet, {id: tabletId}, {...query, database});
        },
        [database],
    );
}

export function checkIsHomePage(pathname: string) {
    const matchFn = match(routes.homePage);
    return Boolean(matchFn(pathname));
}

export function checkIsTenantPage(pathname: string) {
    const matchFn = match(routes.tenant);
    return Boolean(matchFn(pathname));
}
