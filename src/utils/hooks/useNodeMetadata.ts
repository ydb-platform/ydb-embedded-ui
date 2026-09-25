import {isNil} from 'lodash';

import {selectNodesMap} from '../../store/reducers/nodesList';
import type {NodeMetadata} from '../../types/store/nodesList';
import {useTypedSelector} from '../hooks';

import {useDatabaseFromQuery} from './useDatabaseFromQuery';

export function useNodeMetadata(
    nodeId: number | undefined,
    parentNodeData?: NodeMetadata,
): NodeMetadata {
    const database = useDatabaseFromQuery();
    const nodesMap = useTypedSelector((state) => selectNodesMap(state, database));
    const storedNodeData = isNil(nodeId) ? undefined : nodesMap?.get(nodeId);
    return {
        Host: parentNodeData?.Host || storedNodeData?.Host,
        DC: parentNodeData?.DC || storedNodeData?.DC,
        Rack: parentNodeData?.Rack,
    };
}
