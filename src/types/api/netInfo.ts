import type {EFlag} from './enums';

/**
 * endpoint: /viewer/json/netinfo
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/viewer/protos/viewer.proto
 */
export interface TNetInfo {
    Overall: EFlag;
    Tenants?: TNetTenantInfo[];
}

interface TNetTenantInfo {
    Overall: EFlag;
    Name: string;
    Nodes?: TNetNodeInfo[];
}

export interface TNetNodeInfo {
    NodeId: number;
    Overall: EFlag;
    Peers?: TNetNodePeerInfo[];
    NodeType: ENodeType;
    DataCenter: string;
    Rack: string;
    Host: string;
    Port: number;
}

export interface TNetNodePeerInfo {
    NodeId: number;
    PeerName: string;
    Connected: boolean;
    ConnectStatus: EFlag;
    /** uint64 */
    ChangeTime: string;
    NodeType: ENodeType;
    DataCenter: string;
    Rack: string;
    Host: string;
    Port: number;
}

enum ENodeType {
    UnknownNodeType = 'UnknownNodeType',
    Static = 'Static',
    Dynamic = 'Dynamic',
}
