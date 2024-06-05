import type {IssueMessage} from '../query';

import type {TPathID} from './shared';

interface TStaticCredentials {
    User?: string;
    Password?: string;
    PasswordSecretName?: string;
}

interface TOAuthToken {
    Token?: string;
    TokenSecretName?: string;
}

export interface TConnectionParams {
    Endpoint?: string;
    Database?: string;
    StaticCredentials?: TStaticCredentials;
    OAuthToken?: TOAuthToken;
}

interface TTargetEverything {
    DstPrefix?: string;
}

export interface TTarget {
    SrcPath?: string;
    DstPath?: string;
}

interface TTargetSpecific {
    Targets: TTarget[];
}

/**
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/protos/replication.proto
 */
export interface TReplicationConfig {
    SrcConnectionParams?: TConnectionParams;
    Everything?: TTargetEverything;
    Specific?: TTargetSpecific;
    InitialSync?: boolean;
}

interface TStandBy {}
interface TPaused {}

enum EFailoverMode {
    FAILOVER_MODE_UNSPECIFIED = 0,
    FAILOVER_MODE_CONSISTENT = 1,
    FAILOVER_MODE_FORCE = 2,
}

interface TDone {
    FailoverMode?: EFailoverMode;
}

interface TError {
    IssueMessage: IssueMessage[];
}

/**
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/protos/replication.proto
 */
export interface TReplicationState {
    StandBy?: TStandBy;
    Paused?: TPaused;
    Done?: TDone;
    Error?: TError;
}

/**
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/protos/flat_scheme_op.proto
 */
export interface TReplicationDescription {
    Name?: string;
    Config?: TReplicationConfig;
    PathId?: TPathID;
    /** uint64 */
    Version?: string;
    /** uint64 */
    ControllerId?: string; // replication controller's tablet id
    State?: TReplicationState;
}
