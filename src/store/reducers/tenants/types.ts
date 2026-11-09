import type {TTenant, TTenantInfo} from '../../../types/api/tenant';
import type {ValueOf} from '../../../types/common';

import type {METRIC_STATUS} from './contants';

export interface PreparedTenant extends TTenant {
    /** Partial errors for the meta response this database was loaded from. */
    metaErrors?: TTenantInfo['errors'];
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
