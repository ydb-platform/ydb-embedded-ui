import {isNil} from 'lodash';

import type {NodeMetadata} from '../../types/store/nodesList';

import {useNodesMap} from './useNodesMap';

export function useNodeMetadata(
    nodeId: number | undefined,
    parentNodeData?: NodeMetadata,
): NodeMetadata {
    const nodesMap = useNodesMap();
    const storedNodeData = isNil(nodeId) ? undefined : nodesMap?.get(nodeId);
    return {
        Host: parentNodeData?.Host || storedNodeData?.Host,
        DC: parentNodeData?.DC || storedNodeData?.DC,
        DCKey: parentNodeData?.DCKey || storedNodeData?.DCKey,
        Rack: parentNodeData?.Rack || storedNodeData?.Rack,
        PileName: parentNodeData?.PileName || storedNodeData?.PileName,
    };
}
