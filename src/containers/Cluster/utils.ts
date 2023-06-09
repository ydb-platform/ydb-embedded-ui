import type {ValueOf} from '../../types/common';
import routes, {createHref} from '../../routes';

export const clusterTabsIds = {
    tenants: 'tenants',
    nodes: 'nodes',
    storage: 'storage',
    versions: 'versions',
} as const;

export type ClusterTab = ValueOf<typeof clusterTabsIds>;

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

export const clusterTabs = [tenants, nodes, storage, versions];

export const getClusterPath = (activeTab: ClusterTab = clusterTabsIds.tenants, query = {}) => {
    return createHref(routes.cluster, {activeTab}, query);
};
