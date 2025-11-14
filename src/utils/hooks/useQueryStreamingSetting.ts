import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {OLD_BACKEND_CLUSTER_NAMES} from '../constants';

import {useClusterNameFromQuery} from './useDatabaseFromQuery';
import {useSetting} from './useSetting';

export const useQueryStreamingSetting = (): [boolean, (value: boolean) => void] => {
    const clusterName = useClusterNameFromQuery();

    const isOldBackendCluster = clusterName && OLD_BACKEND_CLUSTER_NAMES.includes(clusterName);

    const settingKey = isOldBackendCluster
        ? SETTING_KEYS.ENABLE_QUERY_STREAMING_OLD_BACKEND
        : SETTING_KEYS.ENABLE_QUERY_STREAMING;

    return useSetting<boolean>(settingKey);
};
