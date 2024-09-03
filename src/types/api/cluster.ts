import type {EFlag} from './enums';
import type {TTabletStateInfo} from './tablet';
import type {TTraceCheck, TTraceView} from './trace';

/**
 * endpoint: viewer/json/cluster
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/viewer/protos/viewer.proto
 */
export interface TClusterInfo {
    Name?: string;
    Overall?: EFlag;
    NodesTotal?: number;
    NodesAlive?: number;
    NumberOfCpus?: number;
    /** double */
    LoadAverage?: number;
    /** uint64 */
    MemoryTotal?: string;
    /** uint64 */
    MemoryUsed?: string;
    /** uint64 */
    StorageTotal?: string;
    /** uint64 */
    StorageUsed?: string;
    DataCenters?: string[];
    Versions?: string[];
    SystemTablets?: TTabletStateInfo[];
    /** uint64 */
    Hosts?: string;
    /** uint64 */
    Tenants?: string;
    /** uint64 */
    Tablets?: string;

    /** Cluster root database */
    Domain?: string;

    Balancer?: string; // additional
    Solomon?: string; // additional

    TraceView?: TTraceView;
    TraceCheck?: TTraceCheck;
}
