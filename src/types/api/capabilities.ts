/**
 * endpoint: viewer/capabilities
 */
export interface CapabilitiesResponse {
    Capabilities: Record<Partial<Capability>, number>;
    Settings?: {
        Security?: Record<Partial<SecuritySetting>, boolean>;
        Features?: Partial<Record<FeatureSetting, boolean>>;
        Database?: {
            GraphShardExists?: boolean;
        };
        Cluster?: {
            BridgeModeEnabled?: boolean;
        };
    };
}

// Add feature name before using it
export type Capability =
    | '/pdisk/info'
    | '/pdisk/info/ddisks'
    | '/scheme/directory'
    | '/storage/groups'
    | '/storage/nbs'
    | '/cms/api/json/ddisk/tablets'
    | '/cms/api/json/ddisk/tablet'
    | '/cms/api/json/ddisk/disks'
    | '/viewer/storage_stats'
    | '/viewer/query'
    | '/viewer/feature_flags'
    | '/viewer/config'
    | '/viewer/cluster'
    | '/viewer/tenantinfo'
    | '/vdisk/blobindexstat'
    | '/viewer/nodes'
    | '/viewer/nodes/alive'
    | '/viewer/nodes/ddisks'
    | '/viewer/peers'
    | '/viewer/acl'
    | '/viewer/topic_data'
    | '/operation/list';

export type SecuritySetting = 'UseLoginProvider' | 'DomainLoginOnly';

export type FeatureSetting = 'EnableAnalyzeLongRunningOperation' | 'EnableTabletDevUiSecurePath';

export interface MetaCapabilitiesResponse {
    Capabilities: Record<Partial<MetaCapability>, number>;
}

export type MetaCapability =
    | '/meta/clusters'
    | '/meta/db_clusters'
    | '/meta/cp_databases'
    | '/meta/get_config'
    | '/meta/get_operation'
    | '/meta/list_operations'
    | '/meta/list_storage_types'
    | '/meta/list_resource_presets'
    | '/meta/create_database'
    | '/meta/update_database'
    | '/meta/delete_database'
    | '/meta/simulate_database'
    | '/meta/start_database'
    | '/meta/stop_database'
    | '/meta/create_cluster'
    | '/meta/update_cluster'
    | '/meta/delete_cluster'
    | '/meta/events'
    | '/meta/login'
    | '/meta/oidc/authorize'
    | '/meta/oidc/callback'
    | '/meta/whoami'
    | '/meta/databases'
    | '/meta/environments'
    | '/meta/schema_topic_data';
