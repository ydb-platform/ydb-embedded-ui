/**
 * endpoint: viewer/capabilities
 */
export interface CapabilitiesResponse {
    Capabilities: Record<Partial<Capability>, number>;
}

// Add feature name before using it
export type Capability =
    | '/pdisk/info'
    | '/scheme/directory'
    | '/storage/groups'
    | '/viewer/query'
    | '/viewer/feature_flags'
    | '/viewer/cluster'
    | '/viewer/nodes';
