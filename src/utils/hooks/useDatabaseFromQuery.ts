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
