import {EPathType} from '../../../types/api/schema';

export function transformPath(path: string, dbName: string): string {
    // Normalize the path and dbName by removing leading/trailing slashes
    const normalizedPath = path.replace(/^\/+|\/+$/g, '');
    const normalizedDbName = dbName.replace(/^\/+|\/+$/g, '');

    if (!normalizedPath.startsWith(normalizedDbName)) {
        return normalizedPath || '/';
    }
    if (normalizedPath === normalizedDbName) {
        return `/${normalizedPath}`;
    }

    let result = normalizedPath.slice(normalizedDbName.length);

    // Remove leading slash if present, unless the result would be empty
    result = result.replace(/^\/+/, '') || '/';

    return result;
}

export function isDomain(path: string, type?: EPathType) {
    if (type !== EPathType.EPathTypeDir) {
        return false;
    }
    return path.split('/').length === 2 && path.startsWith('/');
}
