import {backend} from '../store';
import type {AdditionalNodesProps, NodeAddress} from '../types/additionalProps';

import {getBackendFromRawNodeData} from './prepareBackend';

export const getAdditionalNodesProps = (
    balancer = backend,
    useClusterBalancerAsBackend?: boolean,
): AdditionalNodesProps => {
    return {
        getNodeRef: (node: NodeAddress = {}) =>
            getBackendFromRawNodeData(node, balancer ?? '', useClusterBalancerAsBackend),
    };
};
