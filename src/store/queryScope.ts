/** Transport identity is part of the cache key, even when window.api supplies it. */
export interface QueryScope {
    backend?: string;
    environment?: string;
    clusterName?: string;
}

export let backend: string | undefined,
    environment: string | undefined,
    clusterName: string | undefined;

export function setQueryScope(scope: QueryScope) {
    ({backend, environment, clusterName} = scope);
}

export function getQueryScope(overrides?: QueryScope): QueryScope {
    return {backend, environment, clusterName, ...overrides};
}

export function getQueryScopeKey(scope: QueryScope) {
    return JSON.stringify([scope.backend, scope.environment, scope.clusterName]);
}
