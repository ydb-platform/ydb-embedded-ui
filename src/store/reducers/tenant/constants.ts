export const TENANT_PAGE = 'tenantPage';

export const TENANT_PAGES_IDS = {
    query: 'query',
    diagnostics: 'diagnostics',
} as const;

export const TENANT_QUERY_TABS_ID = {
    newQuery: 'newQuery',
    history: 'history',
    saved: 'saved',
} as const;

export const TENANT_DIAGNOSTICS_TABS_IDS = {
    overview: 'overview',
    schema: 'schema',
    topQueries: 'topQueries',
    topShards: 'topShards',
    nodes: 'nodes',
    tablets: 'tablets',
    storage: 'storage',
    network: 'network',
    describe: 'describe',
    hotKeys: 'hotKeys',
    graph: 'graph',
    consumers: 'consumers',
    partitions: 'partitions',
    topicData: 'topicData',
    configs: 'configs',
    operations: 'operations',
    access: 'access',
    backups: 'backups',
} as const;

export const TENANT_SUMMARY_TABS_IDS = {
    overview: 'overview',
    acl: 'acl',
    schema: 'schema',
} as const;

export const TENANT_METRICS_TABS_IDS = {
    cpu: 'cpu',
    storage: 'storage',
    memory: 'memory',
} as const;

export const TENANT_CPU_TABS_IDS = {
    nodes: 'nodes',
    shards: 'shards',
    queries: 'queries',
} as const;

export const TENANT_CPU_NODES_MODE_IDS = {
    load: 'load',
    pools: 'pools',
} as const;
