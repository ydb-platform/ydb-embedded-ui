import {StringParam, useQueryParam} from 'use-query-params';

export function useDatabaseFromQuery() {
    const [database] = useQueryParam('database', StringParam);

    // Remove null from database type
    return database ?? undefined;
}
