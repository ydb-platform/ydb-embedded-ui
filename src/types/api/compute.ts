import {EFlag} from './enums';
import {TEndpoint, TLegacyNodeLocation, TPoolStats} from './nodes';
import {TMetrics} from './tenant';

/**
 * endpoint: viewer/json/compute
 * 
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/viewer/protos/viewer.proto
 */
export interface TComputeInfo {
    Overall: EFlag;
    Tenants?: TComputeTenantInfo[];
    Errors?: string[];
}

interface TComputeTenantInfo {
    Overall: EFlag;
    Name: string;
    Nodes?: TComputeNodeInfo[];
}

export interface TComputeNodeInfo {
    /** uint64 */
    StartTime: string;
    /** uint64 */
    ChangeTime: string;
    SystemLocation: TLegacyNodeLocation;
    /** double */
    LoadAverage: number[];
    NumberOfCpus: number;
    Overall: EFlag;
    NodeId: number;
    DataCenter: string;
    Rack: string;
    Host: string;
    Version: string;
    PoolStats?: TPoolStats[];
    Endpoints?: TEndpoint[];
    Roles?: string[];
    /** uint64 */
    MemoryUsed?: string;
    /** uint64 */
    MemoryLimit?: string;
    Metrics: TMetrics;
    Tablets?: TTabletStateInfo[];
}

// Tablets in compute nodes
// Types for tabletInfo and tablets inside nodes and storage endpoints are in tablet.ts
export interface TTabletStateInfo {
    Type: string;
    State: EFlag;
    Count: number;
}
