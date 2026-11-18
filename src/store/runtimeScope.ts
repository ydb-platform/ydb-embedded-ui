/**
 * The runtime that API responses belong to. Many cache keys (e.g. whoami, capabilities)
 * contain only the database path, which is not unique across clusters and environments.
 */
export interface RuntimeScope {
    environment?: string;
    backend?: string;
    clusterName?: string;
}

function isAnotherValue(previous?: string, next?: string) {
    return Boolean(previous && next && previous !== next);
}

/**
 * Compares the next URL scope with the last known runtime.
 * Pages without a cluster (e.g. the clusters list) do not reset the remembered cluster,
 * so leaving a cluster and returning to it keeps the cached data.
 */
export function getNextRuntimeScope(previous: RuntimeScope, next: RuntimeScope) {
    if (previous.environment !== next.environment) {
        return {scope: next, changed: true};
    }

    return {
        scope: {
            environment: next.environment,
            backend: next.backend ?? previous.backend,
            clusterName: next.clusterName ?? previous.clusterName,
        },
        changed:
            isAnotherValue(previous.backend, next.backend) ||
            isAnotherValue(previous.clusterName, next.clusterName),
    };
}
