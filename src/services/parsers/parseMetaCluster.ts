import type {TClusterInfo} from '../../types/api/cluster';

import type {MetaCluster} from '../../types/api/clusters';

export const parseMetaCluster = (data: MetaCluster): TClusterInfo => {
    const {cluster = {}} = data;

    const {cluster: generalClusterInfo, balancer, solomon} = cluster;

    return {
        ...generalClusterInfo,
        Name: cluster.title || generalClusterInfo?.Name,

        Balancer: balancer,
        Solomon: solomon,
    };
};
