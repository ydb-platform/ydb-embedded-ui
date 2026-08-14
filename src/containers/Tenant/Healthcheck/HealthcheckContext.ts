import React from 'react';

import type {RenderHealthcheckAssistantAction} from '../../../uiFactory/types';

import type {HealthcheckAssistantSnapshot, HealthcheckAssistantTarget} from './types';

export interface HealthcheckContextValue {
    /**
     * Cluster name to inject into generated links.
     * Used when Healthcheck is rendered outside a cluster scope (e.g. on the clusters list),
     * so links point to the correct cluster.
     */
    clusterName?: string;
    /** Database to inject into generated links when healthcheck is opened outside its page. */
    database?: string;
    assistant?: {
        renderAction: RenderHealthcheckAssistantAction;
        target: HealthcheckAssistantTarget;
        snapshot: HealthcheckAssistantSnapshot;
    };
}

export const HealthcheckContext = React.createContext<HealthcheckContextValue>({});

export function useHealthcheckContext() {
    return React.useContext(HealthcheckContext);
}
