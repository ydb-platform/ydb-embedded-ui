/**
 * endpoint: viewer/capabilities
 */
export interface CapabilitiesResponse {
    Capabilities: Record<Partial<Capability>, number>;
    Settings?: {
        Security?: Record<Partial<SecuritySetting>, boolean>;
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
    | '/scheme/directory'
    | '/storage/groups'
    | '/viewer/query'
    | '/viewer/feature_flags'
    | '/viewer/cluster'
    | '/viewer/nodes'
    | '/viewer/acl'
    | '/viewer/topic_data';

export type SecuritySetting = 'UseLoginProvider' | 'DomainLoginOnly';

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
    | '/meta/events';
