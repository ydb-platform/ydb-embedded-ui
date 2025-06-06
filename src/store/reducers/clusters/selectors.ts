import escapeRegExp from 'lodash/escapeRegExp';

import type {ClustersFilters, ClustersStateSlice, PreparedCluster} from './types';

// ==== Simple selectors ====

export const selectClusterNameFilter = (state: ClustersStateSlice) => state.clusters.clusterName;
export const selectStatusFilter = (state: ClustersStateSlice) => state.clusters.status;
export const selectServiceFilter = (state: ClustersStateSlice) => state.clusters.service;
export const selectVersionFilter = (state: ClustersStateSlice) => state.clusters.version;

// ==== Filters ====

const isMatchesByStatus = (clusterData: PreparedCluster, selectedStatuses: string[]) => {
    return (
        selectedStatuses.length === 0 ||
        (clusterData.status && selectedStatuses.includes(clusterData.status))
    );
};

const isMatchesByService = (clusterData: PreparedCluster, selectedServices: string[]) => {
    return (
        selectedServices.length === 0 ||
        (clusterData.service && selectedServices.includes(clusterData.service))
    );
};

const isMatchesByVersion = (clusterData: PreparedCluster, selectedVersions: string[]) => {
    return (
        selectedVersions.length === 0 ||
        selectedVersions.some((selectedVersion) => {
            return clusterData.cluster?.Versions?.some((clusterVersion) =>
                clusterVersion.startsWith(selectedVersion),
            );
        })
    );
};

const isMatchesByTextQuery = (clusterData: PreparedCluster, searchQuery = '') => {
    if (!searchQuery) {
        return true;
    }

    const preparedSearchQuery = searchQuery.toLowerCase();
    const searchTokens = preparedSearchQuery.split(' ');

    // splits a string into words, treating digits as a separate word
    // 'my_cluster env-dev vla03' => ['my', 'cluster', 'env', 'dev', 'vla', '03']
    const splitRegExp = /[^\d\s]+|\d+|[^-\s]+|[^_\s]+/g;

    const clusterNameParts = clusterData.title?.toLowerCase().match(splitRegExp) || [];

    const filteredByName = searchTokens.every((token) => {
        const escapedToken = escapeRegExp(token);
        const startsWithTokenRegExp = new RegExp(`^${escapedToken}|[\\s\\-_]${escapedToken}`, 'i');

        // both tests are required so that both searches '03' and 'vla03' would match 'YDB DEV VLA03'
        return (
            (clusterData.title && startsWithTokenRegExp.test(clusterData.title)) ||
            clusterNameParts.some((name) => name.startsWith(token))
        );
    });
    const filteredByVersion = clusterData.preparedVersions.some((item) =>
        item.version.includes(preparedSearchQuery),
    );
    const filteredByHost = Boolean(clusterData.hosts && clusterData.hosts[preparedSearchQuery]);

    return filteredByName || filteredByVersion || filteredByHost;
};

export function filterClusters(clusters: PreparedCluster[], filters: ClustersFilters) {
    return clusters.filter((cluster) => {
        return (
            isMatchesByStatus(cluster, filters.status) &&
            isMatchesByService(cluster, filters.service) &&
            isMatchesByVersion(cluster, filters.version) &&
            isMatchesByTextQuery(cluster, filters.clusterName)
        );
    });
}
