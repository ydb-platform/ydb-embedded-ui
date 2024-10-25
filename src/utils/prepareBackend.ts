import type {NodeAddress} from '../types/additionalProps';

import {parseBalancer, removeViewerPathname} from './parseBalancer';

const https = 'https://';

export const prepareHost = (host?: string) => {
    // add "u-" prefix to cloud din nodes
    return host?.startsWith('vm-') ? `u-${host}` : host;
};

export const getBackendFromNodeHost = (nodeHost: string, balancer: string) => {
    const preparedHost = prepareHost(nodeHost);
    const proxy = parseBalancer(balancer).proxy;

    if (proxy) {
        return https + proxy + '/' + preparedHost;
    }

    return https + preparedHost;
};

export const getBackendFromRawNodeData = (
    node: NodeAddress,
    balancer: string,
    useBalancerAsBackend?: boolean,
) => {
    const {Host, Endpoints, NodeId} = node;

    if (useBalancerAsBackend && NodeId) {
        const preparedBalancer = removeViewerPathname(balancer);
        return `${preparedBalancer}/node/${NodeId}`;
    }

    if (Host && Endpoints) {
        const nodePort = Endpoints.find((endpoint) => endpoint.Name === 'http-mon')?.Address;

        if (!nodePort || !Host) {
            return null;
        }

        const hostWithPort = Host + nodePort;

        // Currently this func is used to get link to developerUI for specific node
        // It's expected with / at the end (code in embedded version)
        return getBackendFromNodeHost(hostWithPort, balancer);
    }

    return null;
};
