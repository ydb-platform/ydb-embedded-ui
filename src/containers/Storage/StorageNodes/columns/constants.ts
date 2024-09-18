import type {ValueOf} from '../../../../types/common';

import i18n from './i18n';

export const STORAGE_NODES_COLUMNS_WIDTH_LS_KEY = 'storageNodesColumnsWidth';

export const STORAGE_NODES_COLUMNS_IDS = {
    NodeId: 'NodeId',
    Host: 'Host',
    DC: 'DC',
    Rack: 'Rack',
    Uptime: 'Uptime',
    PDisks: 'PDisks',
    Missing: 'Missing',
} as const;

type StorageNodesColumnId = ValueOf<typeof STORAGE_NODES_COLUMNS_IDS>;

export const STORAGE_NODES_COLUMNS_TITLES = {
    get NodeId() {
        return i18n('nodes-id');
    },
    get Host() {
        return i18n('host');
    },
    get DC() {
        return i18n('dc');
    },
    get Rack() {
        return i18n('rack');
    },
    get Uptime() {
        return i18n('uptime');
    },
    get PDisks() {
        return i18n('pdisks');
    },
    get Missing() {
        return i18n('missing');
    },
} as const satisfies Record<StorageNodesColumnId, string>;
