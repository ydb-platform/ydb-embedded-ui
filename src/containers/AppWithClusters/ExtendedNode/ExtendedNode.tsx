import type Node from '../../Node/Node';
import {useClusterData} from '../useClusterData';

export function ExtendedNode({component: NodeComponent}: {component: typeof Node}) {
    const {additionalNodesProps} = useClusterData();

    return <NodeComponent additionalNodesProps={additionalNodesProps} />;
}
