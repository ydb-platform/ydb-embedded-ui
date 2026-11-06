import type {TTenant} from '../../../types/api/tenant';
import type {ValueOf} from '../../../types/common';
import type {PreparedHealthStatus} from '../../../utils/healthStatus/healthStatus';

import type {METRIC_STATUS} from './contants';

export interface PreparedTenant extends TTenant, PreparedHealthStatus {
    sharedTenantName: string | undefined;
    sharedNodeIds: number[] | undefined;
    sharedControlPlane?: TTenant['ControlPlane'];
    controlPlaneName: string;
    cpu: number | undefined;
    memory: number | undefined;
    storage: number | undefined;
    nodesCount: number;
    groupsCount: number;
}

export interface SharedDatabaseTarget {
    name: string;
    nodeIds?: number[];
    controlPlane?: TTenant['ControlPlane'];
}

export type MetricStatus = ValueOf<typeof METRIC_STATUS>;
