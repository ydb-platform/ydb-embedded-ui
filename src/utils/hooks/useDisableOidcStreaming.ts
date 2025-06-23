import {StringParam, useQueryParams} from 'use-query-params';

/**
 * Temporary hook to check if streaming should be disabled for OIDC backends
 * Returns true if the backend parameter contains "oidc"
 */
export const useDisableOidcStreaming = () => {
    const [{backend}] = useQueryParams({backend: StringParam});
    return backend && backend.includes('oidc');
};
