import type {CreateHrefOptions} from '../../routes';
import routes, {createHref} from '../../routes';
import type {ValueOf} from '../../types/common';

export const clusterTabsIds = {
    overview: 'overview',
    tenants: 'tenants',
    nodes: 'nodes',
    storage: 'storage',
    versions: 'versions',
    tablets: 'tablets',
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
const tablets = {
    id: clusterTabsIds.tablets,
    title: 'Tablets',
};

export const clusterTabs = [overview, tenants, nodes, storage, tablets, versions];

export function isClusterTab(tab: any): tab is ClusterTab {
    return Object.values(clusterTabsIds).includes(tab);
}

export const getClusterPath = (activeTab?: ClusterTab, query = {}, options?: CreateHrefOptions) => {
    return createHref(routes.cluster, activeTab ? {activeTab} : undefined, query, options);
};
