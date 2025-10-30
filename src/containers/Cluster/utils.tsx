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
    configs: 'configs',
} as const;

export type ClusterTab = ValueOf<typeof clusterTabsIds>;

const tenants = {
    id: clusterTabsIds.tenants,
    get title() {
        return i18n('tab_databases');
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
const configs = {
    id: clusterTabsIds.configs,
    get title() {
        return i18n('tab_configs');
    },
};

export const clusterTabs = [tenants, nodes, storage, network, tablets, versions, events, configs];

export function isClusterTab(tab: any): tab is ClusterTab {
    return Object.values(clusterTabsIds).includes(tab);
}

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
