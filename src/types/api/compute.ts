import {EFlag} from './enums';
import {TEndpoint, TLegacyNodeLocation, TPoolStats} from './nodes';
import {TMetrics} from './tenant';

/**
 * endpoint: viewer/json/compute
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/viewer/protos/viewer.proto
 *
 * response has 2 versions, depending on version param in request
 */
export interface TComputeInfo {
    Overall: EFlag;
    Tenants?: TComputeTenantInfo[]; // v1
    Errors?: string[];
    /** uint64 */
    TotalNodes: string;
    /** uint64 */
    FoundNodes: string;
    Nodes?: TComputeNodeInfo[]; // v2
}

export interface TComputeTenantInfo {
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
    Tenant?: string; // For v2 response without grouping by tenants
}

// Tablets in compute nodes
// Types for tabletInfo and tablets inside nodes and storage endpoints are in tablet.ts
export interface TTabletStateInfo {
    Type: string;
    State: EFlag;
    Count: number;
}

export enum EVersion {
    v1 = 'v1',
    v2 = 'v2', // only this versions works with sorting
}
