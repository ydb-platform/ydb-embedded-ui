import {StringParam, useQueryParams} from 'use-query-params';

import {
    TENANT_CPU_NODES_MODE_IDS,
    TENANT_CPU_TABS_IDS,
} from '../../../../../store/reducers/tenant/constants';
import type {TenantCpuTab, TenantNodesMode} from '../../../../../store/reducers/tenant/types';

export function useTenantCpuQueryParams() {
    const [queryParams, setQueryParams] = useQueryParams({
        cpuTab: StringParam,
        nodesMode: StringParam,
    });

    // Parse and validate cpuTab with fallback to nodes
    const cpuTab: TenantCpuTab = (() => {
        if (!queryParams.cpuTab) {
            return TENANT_CPU_TABS_IDS.nodes;
        }
        const validTabs = Object.values(TENANT_CPU_TABS_IDS) as string[];
        return validTabs.includes(queryParams.cpuTab)
            ? (queryParams.cpuTab as TenantCpuTab)
            : TENANT_CPU_TABS_IDS.nodes;
    })();

    // Parse and validate nodesMode with fallback to load
    const nodesMode: TenantNodesMode = (() => {
        if (!queryParams.nodesMode) {
            return TENANT_CPU_NODES_MODE_IDS.load;
        }
        const validModes = Object.values(TENANT_CPU_NODES_MODE_IDS) as string[];
        return validModes.includes(queryParams.nodesMode)
            ? (queryParams.nodesMode as TenantNodesMode)
            : TENANT_CPU_NODES_MODE_IDS.load;
    })();

    const handleCpuTabChange = (value: TenantCpuTab) => {
        setQueryParams({cpuTab: value}, 'replaceIn');
    };

    const handleNodesModeChange = (value: TenantNodesMode) => {
        setQueryParams({nodesMode: value}, 'replaceIn');
    };

    return {
        cpuTab,
        nodesMode,
        handleCpuTabChange,
        handleNodesModeChange,
    };
}
