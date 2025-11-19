import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {useSetting} from '../../store/reducers/settings/useSetting';
import {OLD_BACKEND_CLUSTER_NAMES} from '../constants';

import {useClusterNameFromQuery} from './useDatabaseFromQuery';

export const useQueryStreamingSetting = () => {
    const clusterName = useClusterNameFromQuery();

    const isOldBackendCluster = clusterName && OLD_BACKEND_CLUSTER_NAMES.includes(clusterName);

    const settingKey = isOldBackendCluster
        ? SETTING_KEYS.ENABLE_QUERY_STREAMING_OLD_BACKEND
        : SETTING_KEYS.ENABLE_QUERY_STREAMING;

    return useSetting<boolean>(settingKey);
};
