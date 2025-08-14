import type {CreateHrefOptions} from '../../routes';
import routes, {createHref} from '../../routes';
import {useClusterEventsAvailable} from '../../store/reducers/capabilities/hooks';
import type {ClusterGroupsStats} from '../../store/reducers/cluster/types';
import type {ValueOf} from '../../types/common';
import {uiFactory} from '../../uiFactory/uiFactory';

import i18n from './i18n';

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
    get title() {
        return i18n('tab_tenants');
    },
};
const nodes = {
    id: clusterTabsIds.nodes,
    get title() {
        return i18n('tab_nodes');
    },
};
const storage = {
    id: clusterTabsIds.storage,
    get title() {
        return i18n('tab_storage');
    },
};
const network = {
    id: clusterTabsIds.network,
    get title() {
        return i18n('tab_network');
    },
};
const versions = {
    id: clusterTabsIds.versions,
    get title() {
        return i18n('tab_versions');
    },
};
const tablets = {
    id: clusterTabsIds.tablets,
    get title() {
        return i18n('tab_tablets');
    },
};
const events = {
    id: clusterTabsIds.events,
    get title() {
        return i18n('tab_events');
    },
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
