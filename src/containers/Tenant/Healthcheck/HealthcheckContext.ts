import React from 'react';

export interface HealthcheckContextValue {
    /**
     * Cluster name to inject into generated links.
     * Used when Healthcheck is rendered outside a cluster scope (e.g. on the clusters list),
     * so links point to the correct cluster.
     */
    clusterName?: string;
}

export const HealthcheckContext = React.createContext<HealthcheckContextValue>({});

export function useHealthcheckContext() {
    return React.useContext(HealthcheckContext);
}
