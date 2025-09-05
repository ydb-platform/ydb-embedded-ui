import {EPathType} from '../../../types/api/schema';

/**
 * Transforms an absolute database object path to a relative path from the specified database.
 * @param path - source path to the database object
 * @param dbName - database name to make path relative to
 * @param databaseFullPath - full database path (defaults to dbName)
 * @returns transformed relative path
 */
export function transformPath(path: string, dbName: string, databaseFullPath = dbName): string {
    // Normalize the path and dbName by removing leading/trailing slashes
    const normalizedPath = path.replace(/^\/+|\/+$/g, '');
    const normalizedDbName = dbName.replace(/^\/+|\/+$/g, '');
    const normalizedDbFullPath = databaseFullPath.replace(/^\/+|\/+$/g, '');

    if (!normalizedPath.startsWith(normalizedDbName)) {
        return normalizedPath || '/';
    }
    if (normalizedPath === normalizedDbName) {
        return `/${normalizedDbFullPath}`;
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
