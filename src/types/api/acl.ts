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
    EffectiveACL?: TACE[];
    InterruptInheritance?: boolean;
}

export interface TACE {
    AccessType: string;
    AccessRights?: string[];
    AccessRules?: string[];
    Subject: string;
    InheritanceType?: string[];
    AccessRule?: string;
}

export type AccessRightsUpdate = Omit<TACE, 'AccessRules'>;

export interface AccessRightsUpdateRequest {
    AddAccess?: AccessRightsUpdate[];
    RemoveAccess?: AccessRightsUpdate[];
    ChangeOwnership?: {Subject: string};
}

export interface PreparedAccessRights {
    subject: string;
    explicit: string[];
    effective: string[];
}

export interface AccessRuleConfig {
    AccessRights?: string[];
    AccessRules?: string[];
    Name: string;
    Mask: number;
}

export interface AccessRightConfig {
    Name: string;
    Mask: number;
}
export interface InheritanceTypeConfig {
    Name: string;
    Mask: number;
}
export interface AvailablePermissionsConfig {
    AccessRights?: AccessRightConfig[];
    AccessRules?: AccessRuleConfig[];
    InheritanceTypes?: InheritanceTypeConfig[];
}

export interface AvailablePermissionsResponse {
    AvailablePermissions: AvailablePermissionsConfig;
}
