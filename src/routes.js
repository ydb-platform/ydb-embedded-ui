import qs from 'qs';
import {compile} from 'path-to-regexp';
import isEmpty from 'lodash/isEmpty';
import {backend, clusterName, webVersion} from './store';

const routes = {
    viewer: '/viewer',
    cluster: '/cluster/:activeTab?',
    tenant: '/tenant/:page',
    tenantInfo: '/tenantInfo',
    node: '/node/:id/:activeTab?',
    pdisk: '/pdisk/:id',
    group: '/group/:id',
    vdisk: '/vdisk',
    network: '/network',
    pool: '/pool/:poolName',
    tablet: '/tablet/:id',
    tabletsFilters: '/tabletsFilters',
    clusterPage: '/clusters/:name',
};

export function createHref(route, params, query = {}) {
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
