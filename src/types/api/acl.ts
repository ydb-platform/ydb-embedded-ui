/**
 * endpoint: /viewer/json/acl
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/viewer/protos/viewer.proto
 *
 * incomplete, only fields that present for ACL requests
 */
export interface TMetaInfo {
    Common: TMetaCommonInfo;
}

/** incomplete */
export interface TMetaCommonInfo {
    Path: string;
    Owner?: string;
    ACL?: TACE[];
}

interface TACE {
    AccessType: string;
    AccessRights?: string[];
    Subject: string;
    InheritanceType?: string[];
    AccessRule: string;
}
