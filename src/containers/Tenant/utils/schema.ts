import type {NavigationTreeNodeType} from 'ydb-ui-components';
import {EPathType} from '../../../types/api/schema';

export const mapPathTypeToNavigationTreeType = (
    type: EPathType = EPathType.EPathTypeDir,
    defaultType: NavigationTreeNodeType = 'directory'
): NavigationTreeNodeType => {
    switch (type) {
        case EPathType.EPathTypeSubDomain:
            return 'database';
        case EPathType.EPathTypeTable:
        case EPathType.EPathTypeColumnTable:
            return 'table';
        case EPathType.EPathTypeDir:
        case EPathType.EPathTypeColumnStore:
            return 'directory';
        default:
            return defaultType;
    }
};

export const isTableType = (type?: EPathType) =>
    mapPathTypeToNavigationTreeType(type) === 'table';

export const isColumnEntityType = (type?: EPathType) =>
    type === EPathType.EPathTypeColumnStore ||
    type === EPathType.EPathTypeColumnTable;
