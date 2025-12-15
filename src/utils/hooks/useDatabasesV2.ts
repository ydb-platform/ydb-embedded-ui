import {useDatabasesAvailable} from '../../store/reducers/capabilities/hooks';
import {useClusterBaseInfo} from '../../store/reducers/cluster/cluster';

export function useDatabasesV2() {
    const {settings} = useClusterBaseInfo();
    const isMetaDatabasesAvailable = useDatabasesAvailable();

    return settings?.use_meta_proxy !== false && isMetaDatabasesAvailable;
}
