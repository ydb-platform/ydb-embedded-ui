import {useAdditionalNodeProps} from '../../containers/AppWithClusters/useClusterData';
import {useClusterBaseInfo} from '../../store/reducers/cluster/cluster';
import type {PreparedNode} from '../../store/reducers/node/types';
import {
    createDeveloperUIInternalPageHref,
    createDeveloperUILinkWithNodeId,
} from '../developerUI/developerUI';

import {useIsUserAllowedToMakeChanges} from './useIsUserAllowedToMakeChanges';

export function useNodeDeveloperUIHref(node?: PreparedNode) {
    const {balancer} = useClusterBaseInfo();
    const {additionalNodesProps} = useAdditionalNodeProps({balancer});
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();

    if (!isUserAllowedToMakeChanges) {
        return undefined;
    }

    if (additionalNodesProps?.getNodeRef) {
        const developerUIHref = additionalNodesProps.getNodeRef(node);
        return developerUIHref ? createDeveloperUIInternalPageHref(developerUIHref) : undefined;
    }

    if (node?.NodeId) {
        const developerUIHref = createDeveloperUILinkWithNodeId(node.NodeId);
        return createDeveloperUIInternalPageHref(developerUIHref);
    }

    return undefined;
}
