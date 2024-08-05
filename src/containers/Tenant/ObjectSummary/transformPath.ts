// Updated function to transform the path
export default function transformPath(path: string, dbName: string): string {
    // Normalize the path and dbName by removing leading/trailing slashes
    const normalizedPath = path.replace(/^\/+|\/+$/g, '');
    const normalizedDbName = dbName.replace(/^\/+|\/+$/g, '');

    // If the normalized path doesn't start with normalized dbName, return the normalized path
    if (!normalizedPath.startsWith(normalizedDbName)) {
        return normalizedPath || '/';
    }

    // Remove dbName from the beginning of the path
    let result = normalizedPath.slice(normalizedDbName.length);

    // Remove leading slash if present, unless the result would be empty
    result = result.replace(/^\/+/, '') || '/';

    return result;
}
