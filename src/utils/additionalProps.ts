import {backend} from '../store';
import type {AdditionalNodesProps, NodeAddress} from '../types/additionalProps';

import {getBackendFromRawNodeData} from './prepareBackend';

export const getAdditionalNodesProps = ({
    balancer = backend,
    useClusterBalancerAsBackend,
    groupId,
}: {
    balancer?: string;
    useClusterBalancerAsBackend?: boolean;
    groupId?: string;
}): AdditionalNodesProps => {
    return {
        groupId,
        getNodeRef: (node: NodeAddress = {}) =>
            getBackendFromRawNodeData(node, balancer ?? '', useClusterBalancerAsBackend),
    };
};
