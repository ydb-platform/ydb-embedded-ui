export interface NodeMetadata {
    Host?: string;
    DC?: string;
    Rack?: string;
}

export type NodesMap = Map<number, NodeMetadata>;
