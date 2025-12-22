export const CLUSTERS_SELECTED_COLUMNS_KEY = 'selectedColumns';

export const COLUMNS_NAMES = {
    TITLE: 'title',
    VERSIONS: 'versions',
    DC: 'dc',
    SERVICE: 'service',
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

export const COLUMNS_TITLES = {
    [COLUMNS_NAMES.TITLE]: 'Cluster',
    [COLUMNS_NAMES.VERSIONS]: 'Versions',
    [COLUMNS_NAMES.DC]: 'DC',
    [COLUMNS_NAMES.SERVICE]: 'Service',
    [COLUMNS_NAMES.STATUS]: 'Status',
    [COLUMNS_NAMES.NODES]: 'Nodes',
    [COLUMNS_NAMES.LOAD]: 'Load',
    [COLUMNS_NAMES.STORAGE]: 'Storage',
    [COLUMNS_NAMES.HOSTS]: 'Hosts',
    [COLUMNS_NAMES.TENANTS]: 'Databases',
    [COLUMNS_NAMES.DESCRIPTION]: 'Description',
} as const;
