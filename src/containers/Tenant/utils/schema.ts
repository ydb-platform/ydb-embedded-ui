import type {NavigationTreeNodeType} from 'ydb-ui-components';
import {EPathSubType, EPathType} from '../../../types/api/schema';

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

    [EPathType.EPathTypeTableIndex]: 'index',

    [EPathType.EPathTypeColumnTable]: 'column_table',

    [EPathType.EPathTypeCdcStream]: 'topic',
    [EPathType.EPathTypePersQueueGroup]: 'topic',
};

export const mapPathTypeToNavigationTreeType = (
    type: EPathType = EPathType.EPathTypeDir,
    subType?: EPathSubType,
    defaultType: NavigationTreeNodeType = 'directory',
): NavigationTreeNodeType =>
    (subType && pathSubTypeToNodeType[subType]) || pathTypeToNodeType[type] || defaultType;

// ====================

const pathTypeToIsTable: Record<EPathType, boolean> = {
    [EPathType.EPathTypeTable]: true,
    [EPathType.EPathTypeColumnTable]: true,

    [EPathType.EPathTypeInvalid]: false,
    [EPathType.EPathTypeDir]: false,
    [EPathType.EPathTypeSubDomain]: false,
    [EPathType.EPathTypeTableIndex]: false,
    [EPathType.EPathTypeExtSubDomain]: false,
    [EPathType.EPathTypeColumnStore]: false,
    [EPathType.EPathTypeCdcStream]: false,
    [EPathType.EPathTypePersQueueGroup]: false,
};

export const isTableType = (pathType?: EPathType) =>
    (pathType && pathTypeToIsTable[pathType]) ?? false;

// ====================

const pathSubTypeToIsIndexImpl: Record<EPathSubType, boolean> = {
    [EPathSubType.EPathSubTypeSyncIndexImplTable]: true,
    [EPathSubType.EPathSubTypeAsyncIndexImplTable]: true,

    [EPathSubType.EPathSubTypeStreamImpl]: false,
    [EPathSubType.EPathSubTypeEmpty]: false,
};

export const isIndexTable = (subType?: EPathSubType) =>
    (subType && pathSubTypeToIsIndexImpl[subType]) ?? false;

// ====================

const pathTypeToIsColumn: Record<EPathType, boolean> = {
    [EPathType.EPathTypeColumnStore]: true,
    [EPathType.EPathTypeColumnTable]: true,

    [EPathType.EPathTypeInvalid]: false,
    [EPathType.EPathTypeDir]: false,
    [EPathType.EPathTypeTable]: false,
    [EPathType.EPathTypeSubDomain]: false,
    [EPathType.EPathTypeTableIndex]: false,
    [EPathType.EPathTypeExtSubDomain]: false,
    [EPathType.EPathTypeCdcStream]: false,
    [EPathType.EPathTypePersQueueGroup]: false,
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
    [EPathType.EPathTypeTableIndex]: false,
    [EPathType.EPathTypeCdcStream]: false,
    [EPathType.EPathTypePersQueueGroup]: false,
};

export const isDatabaseEntityType = (type?: EPathType) =>
    (type && pathTypeToIsDatabase[type]) ?? false;

// ====================

const pathTypeToIsCdcStream: Record<EPathType, boolean> = {
    [EPathType.EPathTypeCdcStream]: true,

    [EPathType.EPathTypeInvalid]: false,
    [EPathType.EPathTypeColumnStore]: false,
    [EPathType.EPathTypeColumnTable]: false,
    [EPathType.EPathTypeDir]: false,
    [EPathType.EPathTypeTable]: false,
    [EPathType.EPathTypeSubDomain]: false,
    [EPathType.EPathTypeTableIndex]: false,
    [EPathType.EPathTypeExtSubDomain]: false,
    [EPathType.EPathTypePersQueueGroup]: false,
};

export const isCdcStreamEntityType = (type?: EPathType) =>
    (type && pathTypeToIsCdcStream[type]) ?? false;

// ====================

const pathTypeToEntityWithMergedImplementation: Record<EPathType, boolean> = {
    [EPathType.EPathTypeCdcStream]: true,

    [EPathType.EPathTypePersQueueGroup]: false,
    [EPathType.EPathTypeInvalid]: false,
    [EPathType.EPathTypeColumnStore]: false,
    [EPathType.EPathTypeColumnTable]: false,
    [EPathType.EPathTypeDir]: false,
    [EPathType.EPathTypeTable]: false,
    [EPathType.EPathTypeSubDomain]: false,
    [EPathType.EPathTypeTableIndex]: false,
    [EPathType.EPathTypeExtSubDomain]: false,
};

export const isEntityWithMergedImplementation = (type?: EPathType) =>
    (type && pathTypeToEntityWithMergedImplementation[type]) ?? false;

// ====================

const pathSubTypeToChildless: Record<EPathSubType, boolean> = {
    [EPathSubType.EPathSubTypeSyncIndexImplTable]: true,
    [EPathSubType.EPathSubTypeAsyncIndexImplTable]: true,

    [EPathSubType.EPathSubTypeStreamImpl]: false,
    [EPathSubType.EPathSubTypeEmpty]: false,
};

const pathTypeToChildless: Record<EPathType, boolean> = {
    [EPathType.EPathTypeCdcStream]: true,
    [EPathType.EPathTypePersQueueGroup]: true,

    [EPathType.EPathTypeInvalid]: false,
    [EPathType.EPathTypeColumnStore]: false,
    [EPathType.EPathTypeColumnTable]: false,
    [EPathType.EPathTypeDir]: false,
    [EPathType.EPathTypeTable]: false,
    [EPathType.EPathTypeSubDomain]: false,
    [EPathType.EPathTypeTableIndex]: false,
    [EPathType.EPathTypeExtSubDomain]: false,
};

export const isChildlessPathType = (type?: EPathType, subType?: EPathSubType) =>
    ((subType && pathSubTypeToChildless[subType]) || (type && pathTypeToChildless[type])) ?? false;
