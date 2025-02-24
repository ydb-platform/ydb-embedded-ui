import type {PreparedNode} from '../../store/reducers/node/types';
import {
    createDeveloperUIInternalPageHref,
    createDeveloperUILinkWithNodeId,
} from '../developerUI/developerUI';

import {useAdditionalNodesProps} from './useAdditionalNodesProps';
import {useIsUserAllowedToMakeChanges} from './useIsUserAllowedToMakeChanges';

export function useNodeDeveloperUIHref(node?: PreparedNode) {
    const additionalNodesProps = useAdditionalNodesProps();
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
