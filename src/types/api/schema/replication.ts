import type {IssueMessage} from '../query';

import type {TPathID} from './shared';

/**
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/protos/replication.proto
 */
interface TStaticCredentials {
    User?: string;
    Password?: string;
    PasswordSecretName?: string;
}

/**
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/protos/replication.proto
 */
interface TOAuthToken {
    Token?: string;
    TokenSecretName?: string;
}

/**
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/protos/replication.proto
 */
export interface TConnectionParams {
    Endpoint?: string;
    Database?: string;
    StaticCredentials?: TStaticCredentials;
    OAuthToken?: TOAuthToken;
}

interface TReplicationConfigTTargetEverything {
    DstPrefix?: string;
}

export interface TReplicationConfigTTargetSpecificTTarget {
    SrcPath?: string;
    DstPath?: string;
}

interface TReplicationConfigTTargetSpecific {
    Targets: TReplicationConfigTTargetSpecificTTarget[];
}

/**
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/protos/replication.proto
 */
export interface TReplicationConfig {
    SrcConnectionParams?: TConnectionParams;
    Everything?: TReplicationConfigTTargetEverything;
    Specific?: TReplicationConfigTTargetSpecific;
    InitialSync?: boolean;
}

interface TReplicationStateTStandBy {}
interface TReplicationStateTPaused {}

enum TReplicationStateTDoneEFailoverMode {
    FAILOVER_MODE_UNSPECIFIED = 0,
    FAILOVER_MODE_CONSISTENT = 1,
    FAILOVER_MODE_FORCE = 2,
}

interface TReplicationStateTDone {
    FailoverMode?: TReplicationStateTDoneEFailoverMode;
}

interface TReplicationStateTError {
    IssueMessage: IssueMessage[];
}

/**
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/protos/replication.proto
 */
export interface TReplicationState {
    StandBy?: TReplicationStateTStandBy;
    Paused?: TReplicationStateTPaused;
    Done?: TReplicationStateTDone;
    Error?: TReplicationStateTError;
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
