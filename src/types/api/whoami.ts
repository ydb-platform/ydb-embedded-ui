/**
 * endpoint: /viewer/json/whoami
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/library/aclib/protos/aclib.proto
 */
export interface TUserToken {
    UserSID?: string;
    GroupSIDs?: TProtoHashTable;
    OriginalUserToken?: string;
    AuthType?: string;
}

interface TProtoHashTable {
    Buckets?: TProtoHashBucket[];
}

interface TProtoHashBucket {
    Values?: string[];
}
