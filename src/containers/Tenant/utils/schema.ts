import type {NavigationTreeNodeType} from 'ydb-ui-components';

import {EPathSubType, EPathType} from '../../../types/api/schema';
import type {ETenantType} from '../../../types/api/tenant';

// this file contains verbose mappings that are typed in a way that ensures
// correctness when a new node type or a new path type is added
// TS will error if a new entity is added but not mapped here

const pathSubTypeToNodeType: Record<EPathSubType, NavigationTreeNodeType | undefined> = {
    [EPathSubType.EPathSubTypeSyncIndexImplTable]: 'index_table',
    [EPathSubType.EPathSubTypeAsyncIndexImplTable]: 'index_table',

    [EPathSubType.EPathSubTypeStreamImpl]: undefined,
    [EPathSubType.EPathSubTypeEmpty]: undefined,
};

const pathTypeToNodeType: Record<EPathType, NavigationTreeNodeType | undefined> = {
    [EPathType.EPathTypeInvalid]: undefined,

    [EPathType.EPathTypeSubDomain]: 'database',
    [EPathType.EPathTypeExtSubDomain]: 'database',

    [EPathType.EPathTypeDir]: 'directory',
    [EPathType.EPathTypeColumnStore]: 'directory',

    [EPathType.EPathTypeTable]: 'table',
    [EPathType.EPathTypeSysView]: 'system_table',

    [EPathType.EPathTypeTableIndex]: 'index',

    [EPathType.EPathTypeColumnTable]: 'column_table',

    [EPathType.EPathTypeCdcStream]: 'stream',
    [EPathType.EPathTypePersQueueGroup]: 'topic',

    [EPathType.EPathTypeExternalDataSource]: 'external_data_source',
    [EPathType.EPathTypeExternalTable]: 'external_table',

    [EPathType.EPathTypeView]: 'view',

    [EPathType.EPathTypeReplication]: 'async_replication',
    [EPathType.EPathTypeTransfer]: 'transfer',
    [EPathType.EPathTypeResourcePool]: 'resource_pool',
};

export const nodeTableTypeToPathType: Partial<Record<NavigationTreeNodeType, EPathType>> = {
    table: EPathType.EPathTypeTable,
    index: EPathType.EPathTypeTableIndex,
    column_table: EPathType.EPathTypeColumnTable,
    external_table: EPathType.EPathTypeExternalTable,
    view: EPathType.EPathTypeView,
};

export const mapPathTypeToNavigationTreeType = (
    type: EPathType = EPathType.EPathTypeDir,
    subType?: EPathSubType,
    defaultType: NavigationTreeNodeType = 'directory',
): NavigationTreeNodeType =>
    (subType && pathSubTypeToNodeType[subType]) || pathTypeToNodeType[type] || defaultType;

// ====================

const pathSubTypeToEntityName: Record<EPathSubType, string | undefined> = {
    [EPathSubType.EPathSubTypeSyncIndexImplTable]: 'Secondary Index Table',
    [EPathSubType.EPathSubTypeAsyncIndexImplTable]: 'Secondary Index Table',

    [EPathSubType.EPathSubTypeStreamImpl]: undefined,
    [EPathSubType.EPathSubTypeEmpty]: undefined,
};

const pathTypeToEntityName: Record<EPathType, string | undefined> = {
    [EPathType.EPathTypeInvalid]: undefined,

    [EPathType.EPathTypeSubDomain]: 'Database',
    [EPathType.EPathTypeExtSubDomain]: 'Database',

    [EPathType.EPathTypeDir]: 'Directory',
    [EPathType.EPathTypeTable]: 'Table',
    [EPathType.EPathTypeSysView]: 'System view',
    [EPathType.EPathTypeTableIndex]: 'Secondary Index',
    [EPathType.EPathTypeColumnStore]: 'Tablestore',
    [EPathType.EPathTypeColumnTable]: 'Column-oriented table',
    [EPathType.EPathTypeCdcStream]: 'Changefeed',
    [EPathType.EPathTypePersQueueGroup]: 'Topic',

    [EPathType.EPathTypeExternalDataSource]: 'External Data Source',
    [EPathType.EPathTypeExternalTable]: 'External Table',

    [EPathType.EPathTypeView]: 'View',

    [EPathType.EPathTypeReplication]: 'Async Replication',
    [EPathType.EPathTypeTransfer]: 'Transfer',
    [EPathType.EPathTypeResourcePool]: 'Resource Pool',
};

export const mapPathTypeToEntityName = (
    type?: EPathType,
    subType?: EPathSubType,
): string | undefined =>
    (subType && pathSubTypeToEntityName[subType]) || (type && pathTypeToEntityName[type]);

// ====================

const databaseTypeToDBName: Record<ETenantType, string | undefined> = {
    UnknownTenantType: 'Database',
    Domain: 'Cluster Root',
    Dedicated: 'Dedicated Database',
    Shared: 'Shared Database',
    Serverless: 'Serverless Database',
};

export const mapDatabaseTypeToDBName = (type?: ETenantType) => type && databaseTypeToDBName[type];

// ====================

const pathTypeToIsTable: Record<EPathType, boolean> = {
    [EPathType.EPathTypeTable]: true,
    [EPathType.EPathTypeColumnTable]: true,
    [EPathType.EPathTypeSysView]: true,

    [EPathType.EPathTypeExternalTable]: true,

    [EPathType.EPathTypeView]: true,

    [EPathType.EPathTypeInvalid]: false,
    [EPathType.EPathTypeDir]: false,
    [EPathType.EPathTypeSubDomain]: false,
    [EPathType.EPathTypeTableIndex]: false,
    [EPathType.EPathTypeExtSubDomain]: false,
    [EPathType.EPathTypeColumnStore]: false,
    [EPathType.EPathTypeCdcStream]: false,
    [EPathType.EPathTypePersQueueGroup]: false,
    [EPathType.EPathTypeExternalDataSource]: false,
    [EPathType.EPathTypeReplication]: false,
    [EPathType.EPathTypeTransfer]: false,
    [EPathType.EPathTypeResourcePool]: false,
};

//if add entity with tableType, make sure that Schema is available in Diagnostics section
export const isTableType = (pathType?: EPathType) =>
    (pathType && pathTypeToIsTable[pathType]) ?? false;

// ====================

const pathSubTypeToIsIndexImpl: Record<EPathSubType, boolean> = {
    [EPathSubType.EPathSubTypeSyncIndexImplTable]: true,
    [EPathSubType.EPathSubTypeAsyncIndexImplTable]: true,

    [EPathSubType.EPathSubTypeStreamImpl]: false,
    [EPathSubType.EPathSubTypeEmpty]: false,
};

export const isIndexTableType = (subType?: EPathSubType) =>
    (subType && pathSubTypeToIsIndexImpl[subType]) ?? false;

// ====================

const pathTypeToIsColumn: Record<EPathType, boolean> = {
    [EPathType.EPathTypeColumnStore]: true,
    [EPathType.EPathTypeColumnTable]: true,

    [EPathType.EPathTypeInvalid]: false,
    [EPathType.EPathTypeDir]: false,
    [EPathType.EPathTypeTable]: false,
    [EPathType.EPathTypeSysView]: false,
    [EPathType.EPathTypeSubDomain]: false,
    [EPathType.EPathTypeTableIndex]: false,
    [EPathType.EPathTypeExtSubDomain]: false,
    [EPathType.EPathTypeCdcStream]: false,
    [EPathType.EPathTypePersQueueGroup]: false,

    [EPathType.EPathTypeExternalDataSource]: false,
    [EPathType.EPathTypeExternalTable]: false,

    [EPathType.EPathTypeView]: false,

    [EPathType.EPathTypeReplication]: false,
    [EPathType.EPathTypeTransfer]: false,
    [EPathType.EPathTypeResourcePool]: false,
};

export const isColumnEntityType = (type?: EPathType) => (type && pathTypeToIsColumn[type]) ?? false;

// ====================

const pathTypeToIsDatabase: Record<EPathType, boolean> = {
    [EPathType.EPathTypeSubDomain]: true,
    [EPathType.EPathTypeExtSubDomain]: true,

    [EPathType.EPathTypeInvalid]: false,
    [EPathType.EPathTypeDir]: false,
    [EPathType.EPathTypeColumnStore]: false,
    [EPathType.EPathTypeColumnTable]: false,
    [EPathType.EPathTypeTable]: false,
    [EPathType.EPathTypeSysView]: false,
    [EPathType.EPathTypeTableIndex]: false,
    [EPathType.EPathTypeCdcStream]: false,
    [EPathType.EPathTypePersQueueGroup]: false,

    [EPathType.EPathTypeExternalDataSource]: false,
    [EPathType.EPathTypeExternalTable]: false,

    [EPathType.EPathTypeView]: false,

    [EPathType.EPathTypeReplication]: false,
    [EPathType.EPathTypeTransfer]: false,
    [EPathType.EPathTypeResourcePool]: false,
};

export const isDatabaseEntityType = (type?: EPathType) =>
    (type && pathTypeToIsDatabase[type]) ?? false;

// ====================

export const isCdcStreamEntityType = (type?: EPathType) => type === EPathType.EPathTypeCdcStream;

export const isTopicEntityType = (type?: EPathType) => type === EPathType.EPathTypePersQueueGroup;

// ====================

const pathSubTypeToChildless: Record<EPathSubType, boolean> = {
    [EPathSubType.EPathSubTypeSyncIndexImplTable]: true,
    [EPathSubType.EPathSubTypeAsyncIndexImplTable]: true,
    [EPathSubType.EPathSubTypeStreamImpl]: true,

    [EPathSubType.EPathSubTypeEmpty]: false,
};

const pathTypeToChildless: Record<EPathType, boolean> = {
    [EPathType.EPathTypeCdcStream]: false,
    [EPathType.EPathTypePersQueueGroup]: true,

    [EPathType.EPathTypeExternalDataSource]: true,
    [EPathType.EPathTypeExternalTable]: true,

    [EPathType.EPathTypeView]: true,
    [EPathType.EPathTypeResourcePool]: true,

    [EPathType.EPathTypeReplication]: true,
    [EPathType.EPathTypeTransfer]: true,

    [EPathType.EPathTypeInvalid]: false,
    [EPathType.EPathTypeColumnStore]: false,
    [EPathType.EPathTypeColumnTable]: false,
    [EPathType.EPathTypeDir]: false,
    [EPathType.EPathTypeTable]: false,
    [EPathType.EPathTypeSysView]: false,
    [EPathType.EPathTypeSubDomain]: false,
    [EPathType.EPathTypeTableIndex]: false,
    [EPathType.EPathTypeExtSubDomain]: false,
};

export const isChildlessPathType = (type?: EPathType, subType?: EPathSubType) =>
    ((subType && pathSubTypeToChildless[subType]) || (type && pathTypeToChildless[type])) ?? false;

// ====================

export const isExternalTableType = (type?: EPathType) => type === EPathType.EPathTypeExternalTable;
export const isRowTableType = (type?: EPathType) => type === EPathType.EPathTypeTable;
export const isViewType = (type?: EPathType) => type === EPathType.EPathTypeView;
export const isSystemViewType = (type?: EPathType) => type === EPathType.EPathTypeSysView;
