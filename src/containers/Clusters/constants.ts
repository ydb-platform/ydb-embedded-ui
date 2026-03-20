import i18n from './i18n';

export const CLUSTERS_SELECTED_COLUMNS_KEY = 'selectedColumns';

export const COLUMNS_NAMES = {
    TITLE: 'title',
    VERSIONS: 'versions',
    COMPUTE_NODES_VERSIONS: 'computeNodesVersions',
    STORAGE_NODES_VERSIONS: 'storageNodesVersions',
    DC: 'dc',
    SERVICE: 'service',
    DOMAIN: 'domain',
    STATUS: 'status',
    NODES: 'nodes',
    LOAD: 'load',
    STORAGE: 'storage',
    HOSTS: 'hosts',
    TENANTS: 'tenants',
    DESCRIPTION: 'description',
} as const;

export const DEFAULT_COLUMNS = [
    COLUMNS_NAMES.TITLE,
    COLUMNS_NAMES.VERSIONS,
    COLUMNS_NAMES.SERVICE,
    COLUMNS_NAMES.STATUS,
    COLUMNS_NAMES.NODES,
    COLUMNS_NAMES.LOAD,
    COLUMNS_NAMES.STORAGE,
    COLUMNS_NAMES.HOSTS,
    COLUMNS_NAMES.TENANTS,
];

// This code is running when module is initialized and correct language may not be set yet
// get functions guarantee that i18n fields will be inited on render with current render language
export const COLUMNS_TITLES = {
    get [COLUMNS_NAMES.TITLE]() {
        return i18n('field_cluster');
    },
    get [COLUMNS_NAMES.VERSIONS]() {
        return i18n('field_versions');
    },
    get [COLUMNS_NAMES.COMPUTE_NODES_VERSIONS]() {
        return i18n('field_compute-versions');
    },
    get [COLUMNS_NAMES.STORAGE_NODES_VERSIONS]() {
        return i18n('field_storage-versions');
    },
    get [COLUMNS_NAMES.DC]() {
        return i18n('field_dc');
    },
    get [COLUMNS_NAMES.SERVICE]() {
        return i18n('field_service');
    },
    get [COLUMNS_NAMES.DOMAIN]() {
        return i18n('field_domain');
    },
    get [COLUMNS_NAMES.STATUS]() {
        return i18n('field_status');
    },
    get [COLUMNS_NAMES.NODES]() {
        return i18n('field_nodes');
    },
    get [COLUMNS_NAMES.LOAD]() {
        return i18n('field_load');
    },
    get [COLUMNS_NAMES.STORAGE]() {
        return i18n('field_storage');
    },
    get [COLUMNS_NAMES.HOSTS]() {
        return i18n('field_hosts');
    },
    get [COLUMNS_NAMES.TENANTS]() {
        return i18n('field_databases');
    },
    get [COLUMNS_NAMES.DESCRIPTION]() {
        return i18n('field_description');
    },
};
