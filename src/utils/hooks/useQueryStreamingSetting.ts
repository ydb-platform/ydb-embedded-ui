import {
    ENABLE_QUERY_STREAMING,
    ENABLE_QUERY_STREAMING_OLD_BACKEND,
    OLD_BACKEND_CLUSTER_NAMES,
} from '../constants';

import {useClusterNameFromQuery} from './useDatabaseFromQuery';
import {useSetting} from './useSetting';

export const useQueryStreamingSetting = (): [boolean, (value: boolean) => void] => {
    const clusterName = useClusterNameFromQuery();

    const isOldBackendCluster = clusterName && OLD_BACKEND_CLUSTER_NAMES.includes(clusterName);

    const settingKey = isOldBackendCluster
        ? ENABLE_QUERY_STREAMING_OLD_BACKEND
        : ENABLE_QUERY_STREAMING;

    return useSetting<boolean>(settingKey);
};
