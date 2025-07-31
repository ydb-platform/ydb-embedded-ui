import {StringParam, useQueryParams} from 'use-query-params';

import {
    tenantCpuTabSchema,
    tenantNodesModeSchema,
} from '../../../../../store/reducers/tenant/types';
import type {TenantCpuTab, TenantNodesMode} from '../../../../../store/reducers/tenant/types';

export function useTenantCpuQueryParams() {
    const [queryParams, setQueryParams] = useQueryParams({
        cpuTab: StringParam,
        nodesMode: StringParam,
    });

    const cpuTab: TenantCpuTab = tenantCpuTabSchema.parse(queryParams.cpuTab);
    const nodesMode: TenantNodesMode = tenantNodesModeSchema.parse(queryParams.nodesMode);

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
