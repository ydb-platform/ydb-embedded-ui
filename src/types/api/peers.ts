import type {BackendSortParam} from './common';
import type {TNodeStateInfo, TSystemStateInfo} from './nodes';

export interface TPeerStateInfo extends TNodeStateInfo {
    SameScope?: boolean;
    PeerBridgePileName?: string;
}

export interface TPeerInfo {
    SystemState: TSystemStateInfo;
    Forward?: TPeerStateInfo;
    Reverse?: TPeerStateInfo;
}

export interface TPeerGroup {
    GroupName: string;
    PeerCount: string;
}

export interface TPeersResponse {
    Version: number;

    TotalPeers?: string;
    FoundPeers?: string;

    NeedFilter?: boolean;
    NeedGroup?: boolean;
    NeedSort?: boolean;
    NeedLimit?: boolean;

    Problems?: string[];
    CachedDataMaxAge?: string;

    Peers?: TPeerInfo[];
    PeerGroups?: TPeerGroup[];

    NoDC?: boolean;
    NoRack?: boolean;
}

export type PeersSortValue =
    | 'PeerId'
    | 'PeerName'
    | 'DC'
    | 'Rack'
    | 'PileName'
    | 'Version'
    | 'SystemState'
    | 'ConnectStatus'
    | 'NetworkUtilization'
    | 'ClockSkew'
    | 'PingTime'
    | 'BytesSend'
    | 'BytesReceived';

export type PeersGroupByField =
    | 'NodeId'
    | 'Host'
    | 'NodeName'
    | 'PileName'
    | 'SystemState'
    | 'ConnectStatus'
    | 'NetworkUtilization'
    | 'ClockSkew'
    | 'PingTime';

export type PeersFilterGroupByField =
    | 'PeerId'
    | 'PeerName'
    | 'DC'
    | 'Rack'
    | 'PileName'
    | 'SystemState'
    | 'ConnectStatus'
    | 'NetworkUtilization'
    | 'ClockSkew'
    | 'PingTime';

export type PeersSort = BackendSortParam<PeersSortValue>;

export interface PeersRequestParams {
    nodeId: string | number;
    filter?: string;
    sort?: PeersSort;
    group?: PeersGroupByField;
    filter_group_by?: PeersFilterGroupByField;
    filter_group?: string;
    offset?: number;
    limit?: number;
    timeout?: number;
    direct?: boolean;
}
