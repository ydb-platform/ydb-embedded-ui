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

export const OPERATION_METADATA_TYPE_URLS = {
    IndexBuild: 'type.googleapis.com/Ydb.Table.IndexBuildMetadata',
    ImportFromS3: 'type.googleapis.com/Ydb.Import.ImportFromS3Metadata',
    ExportToS3: 'type.googleapis.com/Ydb.Export.ExportToS3Metadata',
    ExportToYt: 'type.googleapis.com/Ydb.Export.ExportToYtMetadata',
} as const;

export type OperationMetadataTypeUrl =
    (typeof OPERATION_METADATA_TYPE_URLS)[keyof typeof OPERATION_METADATA_TYPE_URLS];

/**
 * Import/Export progress enum
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/public/api/protos/ydb_import.proto
 */
export enum ImportExportProgress {
    PROGRESS_UNSPECIFIED = 'PROGRESS_UNSPECIFIED',
    PROGRESS_PREPARING = 'PROGRESS_PREPARING',
    PROGRESS_TRANSFER_DATA = 'PROGRESS_TRANSFER_DATA',
    PROGRESS_BUILD_INDEXES = 'PROGRESS_BUILD_INDEXES',
    PROGRESS_DONE = 'PROGRESS_DONE',
    PROGRESS_CANCELLATION = 'PROGRESS_CANCELLATION',
    PROGRESS_CANCELLED = 'PROGRESS_CANCELLED',
    PROGRESS_CREATE_CHANGEFEEDS = 'PROGRESS_CREATE_CHANGEFEEDS',
}

/**
 * Import/Export item progress
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/public/api/protos/ydb_import.proto
 */
export interface ImportExportItemProgress {
    parts_total?: number;
    parts_completed?: number;
    start_time?: IProtobufTimeObject;
    end_time?: IProtobufTimeObject;
}

/**
 * Import from S3 metadata
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/public/api/protos/ydb_import.proto#L108
 */
export interface ImportFromS3Metadata {
    '@type'?: typeof OPERATION_METADATA_TYPE_URLS.ImportFromS3;
    settings?: {
        endpoint?: string;
        scheme?: string;
        bucket?: string;
        items?: Array<{
            source_prefix?: string;
            source_path?: string;
            destination_path?: string;
        }>;
        [key: string]: unknown;
    };
    progress?: ImportExportProgress | string;
    items_progress?: ImportExportItemProgress[];
}

/**
 * Export to S3 metadata
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/public/api/protos/ydb_export.proto
 */
export interface ExportToS3Metadata {
    '@type'?: typeof OPERATION_METADATA_TYPE_URLS.ExportToS3;
    settings?: {
        endpoint?: string;
        scheme?: string;
        bucket?: string;
        items?: Array<{
            source_path?: string;
            destination_prefix?: string;
        }>;
        [key: string]: unknown;
    };
    progress?: ImportExportProgress | string;
    items_progress?: ImportExportItemProgress[];
}

/**
 * Export to YT metadata
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/public/api/protos/ydb_export.proto
 */
export interface ExportToYtMetadata {
    '@type'?: typeof OPERATION_METADATA_TYPE_URLS.ExportToYt;
    settings?: {
        [key: string]: unknown;
    };
    progress?: ImportExportProgress | string;
    items_progress?: ImportExportItemProgress[];
}

export type TOperationMetadata =
    | IndexBuildMetadata
    | ImportFromS3Metadata
    | ExportToS3Metadata
    | ExportToYtMetadata;

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

    // required and important to pass correct value.
    page_size: number;
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
