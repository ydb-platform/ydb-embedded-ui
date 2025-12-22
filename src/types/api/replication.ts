import type {TIssueMessage} from './operations';

/**
 * endpoint: /json/describe_replication
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/public/api/protos/draft/ydb_replication.proto
 *
 * Original proto file doesn't specify optional fields, so every field is considered optional
 */
export interface DescribeReplicationResult {
    items?: TReplicationItems;

    error?: TReplicationErrorState;
}

export interface TReplicationErrorState {
    issues?: TIssueMessage[];
}

export interface TReplicationItems {
    items?: TReplicationItem[];
}

export interface TReplicationItem {
    id?: string;
    source_path?: string;
    destination_path?: string;
    source_changefeed_name?: string;
}
