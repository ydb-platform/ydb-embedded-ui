import {useClusterData} from '../useClusterData';

import type Node from '../../Node/Node';

export function InternalNode({component: NodeComponent}: {component: typeof Node}) {
    const {additionalNodesProps} = useClusterData();

    return <NodeComponent additionalNodesProps={additionalNodesProps} />;
}
