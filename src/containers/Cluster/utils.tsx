import type {ValueOf} from '../../types/common';
import routes, {createHref} from '../../routes';

export const clusterTabsIds = {
    overview: 'overview',
    tenants: 'tenants',
    nodes: 'nodes',
    storage: 'storage',
    versions: 'versions',
} as const;

export type ClusterTab = ValueOf<typeof clusterTabsIds>;

const overview = {
    id: clusterTabsIds.overview,
    title: 'Overview',
};

const tenants = {
    id: clusterTabsIds.tenants,
    title: 'Databases',
};
const nodes = {
    id: clusterTabsIds.nodes,
    title: 'Nodes',
};
const storage = {
    id: clusterTabsIds.storage,
    title: 'Storage',
};
const versions = {
    id: clusterTabsIds.versions,
    title: 'Versions',
};

export const clusterTabs = [overview, tenants, nodes, storage, versions];

export const getClusterPath = (activeTab: ClusterTab = clusterTabsIds.tenants, query = {}) => {
    return createHref(routes.cluster, {activeTab}, query);
};
