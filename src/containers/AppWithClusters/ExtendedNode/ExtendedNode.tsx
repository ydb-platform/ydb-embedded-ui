import {useClusterBaseInfo} from '../../../store/reducers/cluster/cluster';
import type {Node} from '../../Node/Node';
import {useAdditionalNodeProps} from '../useClusterData';

export function ExtendedNode({component: NodeComponent}: {component: typeof Node}) {
    const {balancer} = useClusterBaseInfo();
    const {additionalNodesProps} = useAdditionalNodeProps({balancer});

    return <NodeComponent additionalNodesProps={additionalNodesProps} />;
}
