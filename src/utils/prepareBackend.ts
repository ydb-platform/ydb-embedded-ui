import {createDeveloperUILinkWithNodeId} from './developerUI/developerUI';
import {prepareBackendFromBalancer} from './parseBalancer';

import {valueIsDefined} from '.';

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
    if (valueIsDefined(nodeId) && valueIsDefined(balancer)) {
        // Use default value instead of balancer if meta proxy is enabled
        const preparedBalancer = useMetaProxy ? undefined : prepareBackendFromBalancer(balancer);
        return createDeveloperUILinkWithNodeId(nodeId, preparedBalancer);
    }

    return undefined;
};
