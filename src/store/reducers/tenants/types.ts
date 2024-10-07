import type {TTenant} from '../../../types/api/tenant';
import type {ValueOf} from '../../../types/common';

import type {METRIC_STATUS} from './contants';

export interface PreparedTenant extends TTenant {
    backend: string | undefined;
    sharedTenantName: string | undefined;
    sharedNodeIds: number[] | undefined;
    controlPlaneName: string;
    cpu: number | undefined;
    memory: number | undefined;
    storage: number | undefined;
    nodesCount: number;
    groupsCount: number;
}

export interface TenantsState {
    searchValue: string;
}

export interface TenantsStateSlice {
    tenants: TenantsState;
}

export type MetricStatus = ValueOf<typeof METRIC_STATUS>;
