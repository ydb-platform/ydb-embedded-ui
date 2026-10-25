import {useEmMetaAvailable} from '../../store/reducers/capabilities/hooks';
import {clusterTabsIds} from '../../store/reducers/cluster/slice';
import {uiFactory} from '../../uiFactory/uiFactory';

import i18n from './i18n';

export {clusterTabsIds, isClusterTab} from '../../store/reducers/cluster/slice';
export type {ClusterTab} from '../../store/reducers/cluster/slice';

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

export function useShouldShowEventsTab() {
    return useEmMetaAvailable() && uiFactory.renderEvents;
}
