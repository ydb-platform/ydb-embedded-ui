import {EFlag} from './enums';
import {TPDiskStateInfo} from './pdisk';
import {TTabletStateInfo} from './tablet';

export interface TNodesInfo {
    Overall: EFlag;
    Nodes?: TNodeInfo[];

    /** uint64 */
    TotalNodes: string;
    /** uint64 */
    FoundNodes: string;
}

export interface TNodeInfo {
    NodeId: number;
    SystemState: TSystemStateInfo;
    PDisks?: TPDiskStateInfo[];
    Tablets?: TTabletStateInfo[];
}

interface TSystemStateInfo {
    /** uint64 */
    StartTime?: string;
    /** uint64 */
    ChangeTime?: string;
    SystemLocation?: TLegacyNodeLocation;
    /** double */
    LoadAverage?: number[];
    NumberOfCpus?: number;
    SystemState?: EFlag;
    MessageBusState?: EFlag;
    GRpcState?: EFlag;
    NodeId?: number;
    Count?: number;
    DataCenterId?: number;
    DataCenterDescription?: string;
    DataCenter?: string;
    RackId?: number;
    Rack?: string;
    Host?: string;
    Version?: string;
    PoolStats?: TPoolStats[];
    Endpoints?: TEndpoint[];
    Roles?: string[];
    Tenants?: string[];
    ClusterName?: string;
    /** uint64 */
    MemoryUsed?: string;
    /** uint64 */
    MemoryLimit?: string;
    ConfigState?: EConfigState; //default = Consistent
    /** uint64 */
    MemoryUsedInAlloc?: string;
    /** double */
    MaxDiskUsage?: number;
    Location?: TNodeLocation;
}

interface TPoolStats {
    Name?: string;
    /** double */
    Usage?: number;
    Threads?: number;
}

interface TEndpoint {
    Name?: string;
    Address?: string;
}

interface TLegacyNodeLocation {
    DataCenter?: number;
    Room?: number;
    Rack?: number;
    Body?: number;
}

interface TNodeLocation {
    // compatibility section -- will be removed in future versions
    DataCenterNum?: number; // deprecated
    RoomNum?: number; // deprecated
    RackNum?: number; // deprecated
    BodyNum?: number; // deprecated
    Body?: number; // deprecated

    DataCenter?: string;
    Module?: string;
    Rack?: string;
    Unit?: string;
}

enum EConfigState {
    'Consistent' = 'Consistent',
    'Outdated' = 'Outdated',
}
