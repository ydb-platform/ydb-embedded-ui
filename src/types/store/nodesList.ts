export interface NodeMetadata {
    Host?: string;
    DC?: string;
    DCKey?: string;
    Rack?: string;
    PileName?: string;
}

export type NodesMap = Map<number, NodeMetadata>;
