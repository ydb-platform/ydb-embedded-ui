import React from 'react';

import {StringParam, useQueryParam} from 'use-query-params';

import {clustersApi} from '../../store/reducers/clusters/clusters';
import {getAdditionalNodesProps} from '../../utils/additionalProps';
import {USE_CLUSTER_BALANCER_AS_BACKEND_KEY} from '../../utils/constants';
import {useSetting} from '../../utils/hooks';

export function useClusterData() {
    const [clusterName] = useQueryParam('clusterName', StringParam);

    const {data} = clustersApi.useGetClustersListQuery(undefined);

    const info = React.useMemo(() => {
        const clusters = data || [];
        return clusters.find((cluster) => cluster.name === clusterName);
    }, [data, clusterName]);

    const {solomon: monitoring, balancer, versions} = info || {};

    return {
        monitoring,
        balancer,
        versions,
        ...useAdditionalNodeProps({balancer}),
    };
}

export function useAdditionalNodeProps({balancer}: {balancer?: string}) {
    const [useClusterBalancerAsBackend] = useSetting<boolean>(USE_CLUSTER_BALANCER_AS_BACKEND_KEY);

    const additionalNodesProps = getAdditionalNodesProps(balancer, useClusterBalancerAsBackend);

    return {additionalNodesProps, useClusterBalancerAsBackend};
}
