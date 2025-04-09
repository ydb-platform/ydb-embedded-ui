import {prepareBackendFromBalancer} from './parseBalancer';

import {valueIsDefined} from '.';

export const prepareHost = (host?: string) => {
    // add "u-" prefix to cloud din nodes
    return host?.startsWith('vm-') ? `u-${host}` : host;
};

/** For multi-cluster version */
export const getBackendFromBalancerAndNodeId = (nodeId?: string | number, balancer?: string) => {
    if (valueIsDefined(nodeId) && valueIsDefined(balancer)) {
        const preparedBalancer = prepareBackendFromBalancer(balancer);
        return `${preparedBalancer}/node/${nodeId}`;
    }

    return undefined;
};
