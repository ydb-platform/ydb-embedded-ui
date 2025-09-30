import {backend} from '../../store';
import {useClusterBaseInfo} from '../../store/reducers/cluster/cluster';
import type {NodeAddress} from '../../types/additionalProps';
import {
    createDeveloperUIInternalPageHref,
    createDeveloperUILinkWithNodeId,
} from '../developerUI/developerUI';
import {getBackendFromBalancerAndNodeId} from '../prepareBackend';

import {useIsUserAllowedToMakeChanges} from './useIsUserAllowedToMakeChanges';
import {useTypedSelector} from './useTypedSelector';

export function useNodeDeveloperUIHref(node?: NodeAddress) {
    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);

    const {balancer = backend} = useClusterBaseInfo();
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();

    if (!isUserAllowedToMakeChanges) {
        return undefined;
    }

    // Only for multi-cluster version since there is no balancer in single-cluster mode
    if (!singleClusterMode) {
        const developerUIHref = getBackendFromBalancerAndNodeId(node?.NodeId, balancer ?? '');
        return developerUIHref ? createDeveloperUIInternalPageHref(developerUIHref) : undefined;
    }

    if (node?.NodeId) {
        const developerUIHref = createDeveloperUILinkWithNodeId(node.NodeId);
        return createDeveloperUIInternalPageHref(developerUIHref);
    }

    return undefined;
}
