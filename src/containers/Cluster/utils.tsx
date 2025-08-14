import type {CreateHrefOptions} from '../../routes';
import routes, {createHref} from '../../routes';
import {useClusterEventsAvailable} from '../../store/reducers/capabilities/hooks';
import type {ClusterGroupsStats} from '../../store/reducers/cluster/types';
import type {ValueOf} from '../../types/common';
import {uiFactory} from '../../uiFactory/uiFactory';

export const clusterTabsIds = {
    tenants: 'tenants',
    nodes: 'nodes',
    storage: 'storage',
    network: 'network',
    versions: 'versions',
    tablets: 'tablets',
    events: 'events',
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
const network = {
    id: clusterTabsIds.network,
    title: 'Network',
};
const versions = {
    id: clusterTabsIds.versions,
    title: 'Versions',
};
const tablets = {
    id: clusterTabsIds.tablets,
    title: 'Tablets',
};
const events = {
    id: clusterTabsIds.events,
    title: 'Events',
};

export const clusterTabs = [tenants, nodes, storage, network, tablets, versions, events];

export function isClusterTab(tab: any): tab is ClusterTab {
    return Object.values(clusterTabsIds).includes(tab);
}

export const getClusterPath = (activeTab?: ClusterTab, query = {}, options?: CreateHrefOptions) => {
    return createHref(routes.cluster, activeTab ? {activeTab} : undefined, query, options);
};

export const getTotalStorageGroupsUsed = (groupStats: ClusterGroupsStats) => {
    return Object.values(groupStats).reduce((acc, data) => {
        Object.values(data).forEach((erasureStats) => {
            acc += erasureStats.createdGroups;
        });

        return acc;
    }, 0);
};

export function useShouldShowEventsTab() {
    return useClusterEventsAvailable() && uiFactory.renderEvents;
}
