import qs from 'qs';
import {compile} from 'path-to-regexp';
import isEmpty from 'lodash/isEmpty';
//@ts-ignore
import {backend, clusterName, webVersion} from './store';

const routes = {
    cluster: '/cluster/:activeTab?',
    tenant: '/tenant',
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

export const CLUSTER_PAGES = {
    tenants: {id: 'tenants', name: 'Databases', title: 'Database list'},
    nodes: {id: 'nodes', name: 'Nodes', title: 'Nodes'},
    storage: {id: 'storage', name: 'Storage', title: 'Storage'},
    cluster: {id: 'cluster', name: 'Cluster', title: 'Cluster'},
};

export function createHref(
    route: string,
    params?: object,
    query: Record<string | number, string | number> = {},
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
