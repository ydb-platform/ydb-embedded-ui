import {useClusterBaseInfo} from '../../store/reducers/cluster/cluster';
import {getAdditionalNodesProps} from '../additionalProps';

import {useTypedSelector} from './useTypedSelector';

/** For multi-cluster version */
export function useAdditionalNodesProps() {
    const {balancer} = useClusterBaseInfo();
    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);

    const additionalNodesProps = getAdditionalNodesProps(balancer);

    return singleClusterMode ? undefined : additionalNodesProps;
}
