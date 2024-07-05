import React from 'react';

import {useLocation} from 'react-router-dom';

import {parseQuery} from '../../routes';
import {clustersApi} from '../../store/reducers/clusters/clusters';
import {getAdditionalNodesProps} from '../../utils/additionalProps';
import {USE_CLUSTER_BALANCER_AS_BACKEND_KEY} from '../../utils/constants';
import {useSetting} from '../../utils/hooks';

export function useClusterData() {
    const location = useLocation();
    const {clusterName} = parseQuery(location);

    const {data} = clustersApi.useGetClustersListQuery(undefined);

    const info = React.useMemo(() => {
        const clusters = data || [];
        return clusters.find((cluster) => cluster.name === clusterName);
    }, [data, clusterName]);

    const {solomon: monitoring, balancer, versions, cluster} = info || {};

    const [useClusterBalancerAsBackend] = useSetting<boolean>(USE_CLUSTER_BALANCER_AS_BACKEND_KEY);

    const additionalNodesProps = getAdditionalNodesProps(balancer, useClusterBalancerAsBackend);

    return {
        monitoring,
        balancer,
        versions,
        cluster,
        useClusterBalancerAsBackend,
        additionalNodesProps,
    };
}
