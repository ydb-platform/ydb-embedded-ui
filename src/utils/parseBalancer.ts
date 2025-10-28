import {environment} from '../store';

import {normalizePathSlashes} from '.';

const protocolRegex = /^http[s]?:\/\//;
const viewerPathnameRegex = /\/viewer(\/json)?$/;

export const removeViewerPathname = (value: string) => {
    return value.replace(viewerPathnameRegex, '');
};
export const removeProtocol = (value: string) => {
    return value.replace(protocolRegex, '');
};

export const removePort = (value: string) => {
    return value.replace(/:\d+$/, '');
};

interface ParsedBalancer {
    balancer: string;
    proxy: string | undefined;
}

/**
 * Parse balancer with proxy. Initial format https://proxy/balancer/viewer/json
 *
 * Full current balancers list could be viewed in YDB Meta cluster\
 * /Root/ydb/MasterClusterExt.db
 */
export const parseBalancer = (rawBalancer: string): ParsedBalancer => {
    // Delete protocol and viewer/json path from raw value
    const value = removeViewerPathname(removeProtocol(rawBalancer));

    // After split the first element is considered a proxy, other - balancer value
    const parts = value.split('/');

    // If there is only one element, balancer is without proxy
    if (parts.length === 1) {
        return {
            balancer: parts[0],
            proxy: undefined,
        };
    }

    const proxy = parts[0];
    const balancer = value.replace(proxy + '/', '');

    return {
        balancer,
        proxy,
    };
};

export const getCleanBalancerValue = (rawBalancer: string) => {
    return removePort(parseBalancer(rawBalancer).balancer);
};

export function prepareBackendFromBalancer(rawBalancer: string) {
    const preparedBalancer = removeViewerPathname(rawBalancer);

    // Test if balancer starts with protocol
    // It means it is a full url and it can be used as it is
    // Otherwise it is a relative path to the current meta backend
    if (protocolRegex.test(rawBalancer)) {
        return preparedBalancer;
    }

    // Use meta_backend if it is defined to form backend url
    if (window.meta_backend) {
        const metaBackend = window.meta_backend;
        const envPrefix = environment ? `/${environment}` : '';

        // If meta_backend is a full URL (has protocol), don't add leading slash
        if (protocolRegex.test(metaBackend)) {
            return normalizePathSlashes(`${metaBackend}/${preparedBalancer}`);
        }

        // For relative meta_backend, include environment prefix
        return normalizePathSlashes(`${envPrefix}/${metaBackend}/${preparedBalancer}`);
    }

    return preparedBalancer;
}

export function prepareBackendWithMetaProxy({clusterName}: {clusterName?: string}) {
    if (!clusterName) {
        return undefined;
    }

    return prepareBackendFromBalancer(`/proxy/cluster/${clusterName}`);
}
