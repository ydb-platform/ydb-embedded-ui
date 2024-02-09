export const removeViewerPathname = (value: string) => {
    return value.replace(/\/viewer\/json/, '');
};
export const removeProtocol = (value: string) => {
    return value.replace(/http[s]?:\/\//, '');
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
