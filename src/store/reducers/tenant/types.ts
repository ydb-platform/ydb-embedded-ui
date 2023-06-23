import type {IResponseError} from '../../../types/api/error';
import type {TTenant} from '../../../types/api/tenant';
import type {ValueOf} from '../../../types/common';
import type {ApiRequestAction} from '../../utils';

import {TENANT_QUERY_TABS_ID, TENANT_DIAGNOSTICS_TABS_IDS, TENANT_PAGES_IDS} from './constants';
import {FETCH_TENANT, clearTenant, setDiagnosticsTab, setQueryTab, setTenantPage} from './tenant';

export type TenantPage = ValueOf<typeof TENANT_PAGES_IDS>;

export type TenantQueryTab = ValueOf<typeof TENANT_QUERY_TABS_ID>;
export type TenantDiagnosticsTab = ValueOf<typeof TENANT_DIAGNOSTICS_TABS_IDS>;

export interface TenantState {
    loading: boolean;
    wasLoaded: boolean;
    tenantPage?: TenantPage;
    queryTab?: TenantQueryTab;
    diagnosticsTab?: TenantDiagnosticsTab;
    tenant?: TTenant;
    error?: IResponseError;
}

export type TenantAction =
    | ApiRequestAction<typeof FETCH_TENANT, TTenant | undefined, IResponseError>
    | ReturnType<typeof clearTenant>
    | ReturnType<typeof setTenantPage>
    | ReturnType<typeof setQueryTab>
    | ReturnType<typeof setDiagnosticsTab>;
