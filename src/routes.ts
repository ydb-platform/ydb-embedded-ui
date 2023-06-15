import qs from 'qs';
import {compile} from 'path-to-regexp';
import isEmpty from 'lodash/isEmpty';

import {backend, clusterName, webVersion} from './store';

const routes = {
    cluster: '/cluster/:activeTab?',
    tenant: '/tenant',
    node: '/node/:id/:activeTab?',
    tablet: '/tablet/:id',
    tabletsFilters: '/tabletsFilters',
    auth: '/auth',
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

export default routes;
