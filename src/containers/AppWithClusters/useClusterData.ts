import React from 'react';

import {StringParam, useQueryParam} from 'use-query-params';

import {clustersApi} from '../../store/reducers/clusters/clusters';

export function useClusterVersions() {
    const [clusterName] = useQueryParam('clusterName', StringParam);

    const {data} = clustersApi.useGetClustersListQuery(undefined);

    return React.useMemo(() => {
        const clusters = data || [];
        const info = clusters.find((cluster) => cluster.name === clusterName);
        return info?.versions;
    }, [data, clusterName]);
}
