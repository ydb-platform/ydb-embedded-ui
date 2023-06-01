import type {Reducer} from 'redux';

import type {TTenant} from '../../../types/api/tenant';
import type {TenantAction, TenantDiagnosticsTab, TenantGeneralTab, TenantState} from './types';

import '../../../services/api';
import {createRequestActionTypes, createApiRequest} from '../../utils';

export const FETCH_TENANT = createRequestActionTypes('tenant', 'FETCH_TENANT');

const SET_TOP_LEVEL_TAB = 'tenant/SET_TOP_LEVEL_TAB';
const SET_DIAGNOSTICS_TAB = 'tenant/SET_DIAGNOSTICS_TAB';
const CLEAR_TENANT = 'tenant/CLEAR_TENANT';

const initialState = {loading: false, wasLoaded: false};

const tenantReducer: Reducer<TenantState, TenantAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_TENANT.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }

        case FETCH_TENANT.SUCCESS: {
            return {
                ...state,
                tenant: action.data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }

        case FETCH_TENANT.FAILURE: {
            return {
                ...state,
                error: action.error,
                loading: false,
                wasLoaded: true,
            };
        }

        case CLEAR_TENANT: {
            return {
                ...state,
                tenant: undefined,
                loading: true,
            };
        }

        case SET_TOP_LEVEL_TAB: {
            return {
                ...state,
                topLevelTab: action.data,
            };
        }

        case SET_DIAGNOSTICS_TAB: {
            return {
                ...state,
                diagnosticsTab: action.data,
            };
        }

        default:
            return state;
    }
};

export const getTenantInfo = ({path}: {path: string}) => {
    return createApiRequest({
        request: window.api.getTenantInfo({path}),
        actions: FETCH_TENANT,
        dataHandler: (tenantData): TTenant | undefined => {
            return tenantData.TenantInfo?.[0];
        },
    });
};

export const clearTenant = () => {
    return {type: CLEAR_TENANT} as const;
};

export function setTopLevelTab(tab: TenantGeneralTab) {
    return {
        type: SET_TOP_LEVEL_TAB,
        data: tab,
    } as const;
}

export function setDiagnosticsTab(tab: TenantDiagnosticsTab) {
    return {
        type: SET_DIAGNOSTICS_TAB,
        data: tab,
    } as const;
}

export default tenantReducer;
