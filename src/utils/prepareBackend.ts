import {isNil} from 'lodash';

import {createDeveloperUILinkWithNodeId} from './developerUI/developerUI';
import {prepareBackendFromBalancer} from './parseBalancer';

export const prepareHost = (host?: string) => {
    // add "u-" prefix to cloud din nodes
    return host?.startsWith('vm-') ? `u-${host}` : host;
};

/** For multi-cluster version */
export const getBackendFromBalancerAndNodeId = (
    nodeId?: string | number,
    balancer?: string,
    useMetaProxy?: boolean,
) => {
    if (isNil(nodeId)) {
        return undefined;
    }
    if (useMetaProxy) {
        return createDeveloperUILinkWithNodeId(nodeId);
    }
    if (!isNil(balancer)) {
        const preparedBalancer = prepareBackendFromBalancer(balancer);
        return createDeveloperUILinkWithNodeId(nodeId, preparedBalancer);
    }
    return undefined;
};
