/**
 * endpoint: /viewer/json/nodesList
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/library/cpp/actors/core/interconnect.h
 */
export type TEvNodesInfo = TNodeInfo[];

export interface TNodeInfo {
    Id?: number;
    Host?: string;
    ResolveHost?: string;
    Address?: string;
    Port?: number;
    PhysicalLocation?: TNodeLocation;
}

interface TNodeLocation {
    DataCenter?: number;
    Room?: number;
    Rack?: number;
    Body?: number;
    DataCenterId?: string;
    /** String with DC, Module, Rack and Unit ids */
    Location?: string;
}
