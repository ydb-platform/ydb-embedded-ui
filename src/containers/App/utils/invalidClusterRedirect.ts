import {getClustersPath, getDatabasesPath} from '../../../routes';
import type {MetaBaseClusterInfo} from '../../../types/api/meta';
import {isResponseError} from '../../../utils/response';

const CLUSTER_NOT_FOUND_MESSAGE = 'Cluster not found';

type ClusterResolveState = {
    currentData?: MetaBaseClusterInfo;
    error?: unknown;
    isSuccess: boolean;
};

export function isInvalidClusterRouteState({
    currentData: _currentData,
    error,
    isSuccess: _isSuccess,
}: ClusterResolveState) {
    return Boolean(isResponseError(error) && error.data === CLUSTER_NOT_FOUND_MESSAGE);
}

export function getInvalidClusterRedirectPath(databasesPageAvailable: boolean) {
    if (databasesPageAvailable) {
        return getDatabasesPath({backend: '', clusterName: ''});
    }

    return getClustersPath({backend: '', clusterName: ''});
}
