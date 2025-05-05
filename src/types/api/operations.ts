import type {IProtobufTimeObject} from './common';

/**
 * endpoint: /operation/list
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/public/api/protos/ydb_operation.proto
 */
export enum EStatusCode {
    STATUS_CODE_UNSPECIFIED = 'STATUS_CODE_UNSPECIFIED',
    SUCCESS = 'SUCCESS',
    BAD_REQUEST = 'BAD_REQUEST',
    UNAUTHORIZED = 'UNAUTHORIZED',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    ABORTED = 'ABORTED',
    UNAVAILABLE = 'UNAVAILABLE',
    OVERLOADED = 'OVERLOADED',
    SCHEME_ERROR = 'SCHEME_ERROR',
    GENERIC_ERROR = 'GENERIC_ERROR',
    TIMEOUT = 'TIMEOUT',
    BAD_SESSION = 'BAD_SESSION',
    PRECONDITION_FAILED = 'PRECONDITION_FAILED',
    ALREADY_EXISTS = 'ALREADY_EXISTS',
    NOT_FOUND = 'NOT_FOUND',
    SESSION_EXPIRED = 'SESSION_EXPIRED',
    CANCELLED = 'CANCELLED',
    UNDETERMINED = 'UNDETERMINED',
    UNSUPPORTED = 'UNSUPPORTED',
    SESSION_BUSY = 'SESSION_BUSY',
    EXTERNAL_ERROR = 'EXTERNAL_ERROR',
}

export interface TPosition {
    row?: number;
    column?: number;
    file?: string;
}

export interface TIssueMessage {
    position?: TPosition;
    message?: string;
    end_position?: TPosition;
    issue_code?: number;
    severity?: number;
    issues?: TIssueMessage[];
}

export interface IndexBuildMetadata {
    '@type'?: 'type.googleapis.com/Ydb.Table.IndexBuildMetadata';
    description?: IndexBuildDescription;
    state?: IndexBuildState;
    progress?: number;
}

interface IndexBuildDescription {
    path?: string;
    index?: TableIndex;
}

export type TGlobalIndex = {_type?: 'global_index'; global_index: unknown};
export type TGlobalAsyncIndex = {_type?: 'global_async_index'; global_async_index: unknown};
export type TGlobalUniqueIndex = {_type?: 'global_unique_index'; global_unique_index: unknown};
export type TGlobalVectorKmeansTreeIndexIndex = {
    _type?: 'global_vector_kmeans_tree_index';
    global_vector_kmeans_tree_index: unknown;
};

export type TIndexType =
    | TGlobalIndex
    | TGlobalAsyncIndex
    | TGlobalUniqueIndex
    | TGlobalVectorKmeansTreeIndexIndex;

type TableIndex = {
    name?: string;
    index_columns?: string[];
    data_columns?: string[];
} & TIndexType;

export enum IndexBuildState {
    STATE_UNSPECIFIED = 'STATE_UNSPECIFIED',
    STATE_PREPARING = 'STATE_PREPARING',
    STATE_TRANSFERING_DATA = 'STATE_TRANSFERING_DATA',
    STATE_APPLYING = 'STATE_APPLYING',
    STATE_DONE = 'STATE_DONE',
    STATE_CANCELLATION = 'STATE_CANCELLATION',
    STATE_CANCELLED = 'STATE_CANCELLED',
    STATE_REJECTION = 'STATE_REJECTION',
    STATE_REJECTED = 'STATE_REJECTED',
}

export type TOperationMetadata = IndexBuildMetadata;

export interface TCostInfo {
    consumed_units?: number;
}

export interface TOperation {
    id?: string;
    ready?: boolean;
    status?: EStatusCode;
    issues?: TIssueMessage[];
    metadata?: TOperationMetadata;
    cost_info?: TCostInfo;
    create_time?: IProtobufTimeObject;
    end_time?: IProtobufTimeObject;
    created_by?: string;
}

export interface TOperationList {
    status?: EStatusCode;
    issues?: TIssueMessage[];
    operations?: TOperation[];
    next_page_token?: string;
}

export type OperationKind =
    | 'ss/backgrounds'
    | 'import'
    | 'import/s3'
    | 'export/s3'
    | 'export/yt'
    | 'buildindex'
    | 'scriptexec';

export interface OperationListRequestParams {
    database: string;
    kind: OperationKind;
    page_size?: number;
    page_token?: string;
}

export interface OperationCancelRequestParams {
    database: string;
    id: string;
}

export interface OperationForgetRequestParams {
    database: string;
    id: string;
}
