import type {MetaClusters} from '../../../types/api/meta';
import {
    getVersionColors,
    getVersionMap,
    prepareClusterVersions,
} from '../../../utils/clusterVersionColors';
import {prepareBackendFromBalancer} from '../../../utils/parseBalancer';

import type {PreparedCluster} from './types';

export const prepareClustersData = (data: MetaClusters): PreparedCluster[] => {
    const {clusters = []} = data;

    let allMinorVersions = new Map();

    // Collect all clusters minor versions
    clusters.forEach(({versions = []}) => {
        allMinorVersions = getVersionMap(versions, allMinorVersions);
    });

    // Get colors map for all clusters colors
    const versionToColor = getVersionColors(allMinorVersions);

    // Apply color map to every cluster in the list
    return clusters.map((cluster) => ({
        ...cluster,
        preparedVersions: prepareClusterVersions(cluster.versions, versionToColor),
        preparedBackend: cluster.balancer
            ? prepareBackendFromBalancer(cluster.balancer)
            : undefined,
    }));
};
