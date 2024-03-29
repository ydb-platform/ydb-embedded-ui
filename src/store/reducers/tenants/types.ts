import {FETCH_TENANTS, setSearchValue} from './tenants';

import {ValueOf} from '../../../types/common';
import type {TTenant} from '../../../types/api/tenant';
import type {IResponseError} from '../../../types/api/error';
import type {ApiRequestAction} from '../../utils';
import {METRIC_STATUS} from './contants';

export interface PreparedTenant extends TTenant {
    backend: string | undefined;
    sharedTenantName: string | undefined;
    controlPlaneName: string;
    cpu: number;
    memory: number;
    storage: number;
    nodesCount: number;
    groupsCount: number;
}

export interface TenantsState {
    loading: boolean;
    wasLoaded: boolean;
    searchValue: string;
    tenants: PreparedTenant[];
    error?: IResponseError;
}

export type TenantsAction =
    | ApiRequestAction<typeof FETCH_TENANTS, PreparedTenant[], IResponseError>
    | ReturnType<typeof setSearchValue>;

export interface TenantsStateSlice {
    tenants: TenantsState;
}

export type MetricStatus = ValueOf<typeof METRIC_STATUS>;
