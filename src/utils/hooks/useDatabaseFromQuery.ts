import {StringParam, useQueryParam} from 'use-query-params';

export function useDatabaseFromQuery() {
    const [database] = useQueryParam('database', StringParam);

    // Remove null from type
    return database ?? undefined;
}

export function useClusterNameFromQuery() {
    const [clusterName] = useQueryParam('clusterName', StringParam);

    // Remove null from type
    return clusterName ?? undefined;
}

/**
 * Control plane id of the database from the `databaseId` URL parameter.
 * It describes the database of the page only, so it is ignored for any other database.
 */
export function useDatabaseIdFromQuery(database?: string) {
    const [databaseId] = useQueryParam('databaseId', StringParam);
    const databaseFromQuery = useDatabaseFromQuery();

    return databaseId && database === databaseFromQuery ? databaseId : undefined;
}
