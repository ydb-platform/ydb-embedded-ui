import {FETCH_TENANTS} from './tenants';

import type {TTenant} from '../../../types/api/tenant';
import type {ApiRequestAction} from '../../utils';

export interface PreparedTenant extends TTenant {
    backend?: string;
}

export interface TenantsState {
    loading: boolean;
    wasLoaded: boolean;
    tenants?: PreparedTenant[];
    error?: unknown;
}

export type TenantsAction = ApiRequestAction<typeof FETCH_TENANTS, PreparedTenant[], unknown>;
