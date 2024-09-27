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
    let count = 0;
    for (let i = 0; i <= path.length; i++) {
        if (path[i] === '/') {
            count++;
        }
        if (count > 1) {
            return false;
        }
    }
    return count === 1;
}
