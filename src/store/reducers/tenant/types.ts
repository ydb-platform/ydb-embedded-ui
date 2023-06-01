import type {IResponseError} from '../../../types/api/error';
import type {TTenant} from '../../../types/api/tenant';
import type {ValueOf} from '../../../types/common';
import type {ApiRequestAction} from '../../utils';

import {TENANT_DIAGNOSTICS_TABS_IDS, TENANT_GENERAL_TABS_IDS} from './constants';
import {FETCH_TENANT, clearTenant, setDiagnosticsTab, setTopLevelTab} from './tenant';

export type TenantGeneralTab = ValueOf<typeof TENANT_GENERAL_TABS_IDS>;
export type TenantDiagnosticsTab = ValueOf<typeof TENANT_DIAGNOSTICS_TABS_IDS>;

export interface TenantState {
    loading: boolean;
    wasLoaded: boolean;
    topLevelTab?: TenantGeneralTab;
    diagnosticsTab?: TenantDiagnosticsTab;
    tenant?: TTenant;
    error?: IResponseError;
}

export type TenantAction =
    | ApiRequestAction<typeof FETCH_TENANT, TTenant | undefined, IResponseError>
    | ReturnType<typeof clearTenant>
    | ReturnType<typeof setTopLevelTab>
    | ReturnType<typeof setDiagnosticsTab>;
