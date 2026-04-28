import React from 'react';

import {useEmMetaAvailable} from '../../../store/reducers/capabilities/hooks';
import {useClusterBaseInfo} from '../../../store/reducers/cluster/cluster';
import {clustersApi} from '../../../store/reducers/clusters/clusters';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {isAccessError} from '../../../utils/response';

interface UseClusterDataParams {
    metaCapabilitiesLoaded: boolean;
    isClustersHomePage: boolean;
}

export function useClusterData({metaCapabilitiesLoaded, isClustersHomePage}: UseClusterDataParams) {
    const clusterData = useClusterBaseInfo();
    const {title: clusterTitle, name: clusterName, monitoring} = clusterData;

    const {isLoading: isClustersLoading, error: clustersError} =
        clustersApi.useGetClustersListQuery(undefined, {
            skip: !isClustersHomePage || !metaCapabilitiesLoaded,
        });

    const emMetaAvailable = useEmMetaAvailable();
    const isAddClusterAvailable =
        emMetaAvailable &&
        uiFactory.onAddCluster !== undefined &&
        !isClustersLoading &&
        !isAccessError(clustersError);

    const onEditCluster = emMetaAvailable ? uiFactory.onEditCluster : undefined;
    const onDeleteCluster = emMetaAvailable ? uiFactory.onDeleteCluster : undefined;

    const handleEditCluster = React.useMemo(() => {
        if (!onEditCluster) {
            return undefined;
        }

        return () => {
            return onEditCluster({clusterData});
        };
    }, [clusterData, onEditCluster]);

    const handleDeleteCluster = React.useMemo(() => {
        if (!onDeleteCluster) {
            return undefined;
        }

        return () => {
            return onDeleteCluster({clusterData});
        };
    }, [clusterData, onDeleteCluster]);

    return {
        clusterData,
        clusterTitle,
        clusterName,
        monitoring,
        isAddClusterAvailable,
        handleEditCluster,
        handleDeleteCluster,
    };
}
