import {backend} from '../store';
import type {AdditionalNodesProps} from '../types/additionalProps';

import {getBackendFromBalancerAndNodeId} from './prepareBackend';

export const getAdditionalNodesProps = (balancer = backend): AdditionalNodesProps => {
    return {
        getNodeRef: (node) => getBackendFromBalancerAndNodeId(node?.NodeId, balancer ?? ''),
    };
};
