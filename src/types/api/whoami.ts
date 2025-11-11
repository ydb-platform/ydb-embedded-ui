/**
 * endpoint: /viewer/json/whoami
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/library/aclib/protos/aclib.proto
 */
export interface TUserToken {
    UserSID?: string;
    // Generated ID when user is not authenticated
    UserID?: string;
    GroupSIDs?: TProtoHashTable;
    OriginalUserToken?: string;
    AuthType?: string;

    /** Is user allowed to view only database specific data */
    IsDatabaseAllowed?: boolean;
    /** Is user allowed to view data (includes IsDatabaseAllowed rights) */
    IsViewerAllowed?: boolean;
    /** Is user allowed to view deeper and make simple changes */
    IsMonitoringAllowed?: boolean;
    /** Is user allowed to do unrestricted changes in the system */
    IsAdministrationAllowed?: boolean;
}

interface TProtoHashTable {
    Buckets?: TProtoHashBucket[];
}

interface TProtoHashBucket {
    Values?: string[];
}
