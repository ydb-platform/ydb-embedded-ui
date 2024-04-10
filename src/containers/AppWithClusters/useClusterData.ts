import {useLocation} from 'react-router';

import {parseQuery} from '../../routes';
import {selectClusterInfo} from '../../store/reducers/clusters/selectors';
import {getAdditionalNodesProps} from '../../utils/additionalProps';
import {USE_CLUSTER_BALANCER_AS_BACKEND_KEY} from '../../utils/constants';
import {useSetting, useTypedSelector} from '../../utils/hooks';
import {useClustersList} from '../Clusters/useClustersList';

export function useClusterData() {
    useClustersList();
    const location = useLocation();

    const queryParams = parseQuery(location);

    const {clusterName} = queryParams;

    const {
        solomon: monitoring,
        balancer,
        versions,
        cluster,
    } = useTypedSelector((state) =>
        selectClusterInfo(state, typeof clusterName === 'string' ? clusterName : ''),
    );

    const [useClusterBalancerAsBackend] = useSetting<boolean>(USE_CLUSTER_BALANCER_AS_BACKEND_KEY);

    const additionalNodesProps = getAdditionalNodesProps(balancer, useClusterBalancerAsBackend);

    return {
        monitoring,
        balancer,
        versions,
        cluster,
        useClusterBalancerAsBackend,
        additionalNodesProps,
    };
}
