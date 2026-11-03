export interface NodeMetadata {
    Host?: string;
    DC?: string;
    DCKey?: string;
    Rack?: string;
}

export type NodesMap = Map<number, NodeMetadata>;
