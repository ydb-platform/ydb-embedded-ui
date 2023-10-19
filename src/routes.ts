import type {Location} from 'history';
import qs from 'qs';
import {compile} from 'path-to-regexp';
import isEmpty from 'lodash/isEmpty';

import {backend, clusterName, webVersion} from './store';

export const CLUSTER = 'cluster';
export const TENANT = 'tenant';
export const NODE = 'node';
export const TABLET = 'tablet';

const routes = {
    cluster: `/${CLUSTER}/:activeTab?`,
    tenant: `/${TENANT}`,
    node: `/${NODE}/:id/:activeTab?`,
    tablet: `/${TABLET}/:id`,
    tabletsFilters: `/tabletsFilters`,
    auth: `/auth`,
};

export const parseQuery = (location: Location) => {
    return qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });
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

    return `${compile(route)(params)}${search}`;
}

// embedded version could be located in some folder (e.g. host/some_folder/app_router_path)
// window.location has the full pathname, while location from router ignores path to project
// this navigation assumes page reloading
export const createExternalUILink = (query = {}) =>
    createHref(window.location.pathname, undefined, query);

export default routes;
