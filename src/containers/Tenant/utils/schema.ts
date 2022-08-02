import type {NavigationTreeNodeType} from 'ydb-ui-components';
import {EPathSubType, EPathType} from '../../../types/api/schema';

const mapTablePathSubTypeToNavigationTreeType = (subType?: EPathSubType) => {
    switch (subType) {
        case EPathSubType.EPathSubTypeSyncIndexImplTable:
        case EPathSubType.EPathSubTypeAsyncIndexImplTable:
            return 'index_table';
        default:
            return 'table';
    }
};

export const mapPathTypeToNavigationTreeType = (
    type: EPathType = EPathType.EPathTypeDir,
    subType?: EPathSubType,
    defaultType: NavigationTreeNodeType = 'directory'
): NavigationTreeNodeType => {
    switch (type) {
        case EPathType.EPathTypeSubDomain:
            return 'database';
        case EPathType.EPathTypeTable:
            return mapTablePathSubTypeToNavigationTreeType(subType);
        case EPathType.EPathTypeColumnTable:
            return 'column_table';
        case EPathType.EPathTypeDir:
        case EPathType.EPathTypeColumnStore:
            return 'directory';
        case EPathType.EPathTypeTableIndex:
            return 'index';
        case EPathType.EPathTypeCdcStream:
            return 'topic';
        default:
            return defaultType;
    }
};

export const isTableType = (type?: EPathType) =>
    mapPathTypeToNavigationTreeType(type) === 'table';

export const isIndexTable = (subType?: EPathSubType) =>
    mapTablePathSubTypeToNavigationTreeType(subType) === 'index_table';

export const isColumnEntityType = (type?: EPathType) =>
    type === EPathType.EPathTypeColumnStore ||
    type === EPathType.EPathTypeColumnTable;
