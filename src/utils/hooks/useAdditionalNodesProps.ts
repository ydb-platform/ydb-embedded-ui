import {useClusterBaseInfo} from '../../store/reducers/cluster/cluster';
import {getAdditionalNodesProps} from '../additionalProps';
import {USE_CLUSTER_BALANCER_AS_BACKEND_KEY} from '../constants';

import {useSetting} from './useSetting';
import {useTypedSelector} from './useTypedSelector';

/** For multi-cluster version */
export function useAdditionalNodesProps() {
    const {balancer} = useClusterBaseInfo();
    const [useClusterBalancerAsBackend] = useSetting<boolean>(USE_CLUSTER_BALANCER_AS_BACKEND_KEY);
    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);

    const additionalNodesProps = getAdditionalNodesProps(balancer, useClusterBalancerAsBackend);

    return singleClusterMode ? undefined : additionalNodesProps;
}
