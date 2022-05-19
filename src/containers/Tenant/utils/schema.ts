import type {NavigationTreeNodeType} from "ydb-ui-components";

const DB_TYPES = new Set(['EPathTypeSubDomain']);
const TABLE_TYPES = new Set(['EPathTypeTable', 'EPathTypeOlapTable']);
const DIR_TYPES = new Set(['EPathTypeDir', 'EPathTypeOlapStore']);

export const calcNavigationTreeType = (type: string): NavigationTreeNodeType => {
    if (DIR_TYPES.has(type)) {
        return 'directory';
    } else if (TABLE_TYPES.has(type)) {
        return 'table';
    } else if (DB_TYPES.has(type)) {
        return 'database';
    }

    return 'directory';
};
