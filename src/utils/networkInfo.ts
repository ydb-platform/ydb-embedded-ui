interface NetworkConnectionInfo {
    effectiveType?: string;
    rtt?: number;
    downlink?: number;
}

interface NavigatorWithConnection extends Navigator {
    connection?: NetworkConnectionInfo;
}

export interface NetworkContext {
    online: boolean;
    effectiveType?: string;
    rtt?: number;
    downlink?: number;
}

export function getNetworkContext(): NetworkContext {
    const result: NetworkContext = {
        online: navigator.onLine,
    };

    const nav = navigator as NavigatorWithConnection;
    const conn = nav.connection;
    if (conn) {
        if (typeof conn.effectiveType === 'string') {
            result.effectiveType = conn.effectiveType;
        }
        if (typeof conn.rtt === 'number') {
            result.rtt = conn.rtt;
        }
        if (typeof conn.downlink === 'number') {
            result.downlink = conn.downlink;
        }
    }

    return result;
}
