import type {Reducer} from 'redux';

import {createRequestActionTypes, createApiRequest} from '../../utils';

import type {TenantsAction, TenantsState} from './types';
import {prepareTenants} from './utils';

export const FETCH_TENANTS = createRequestActionTypes('tenants', 'FETCH_TENANTS');

const SET_SEARCH_VALUE = 'tenants/SET_SEARCH_VALUE';

const initialState = {loading: true, wasLoaded: false, searchValue: '', tenants: []};

const tenants: Reducer<TenantsState, TenantsAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_TENANTS.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_TENANTS.SUCCESS: {
            return {
                ...state,
                tenants: action.data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_TENANTS.FAILURE: {
            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        case SET_SEARCH_VALUE: {
            return {
                ...state,
                searchValue: action.data,
            };
        }
        default:
            return state;
    }
};

export function getTenantsInfo(clusterName?: string) {
    return createApiRequest({
        request: window.api.getTenants(clusterName),
        actions: FETCH_TENANTS,
        dataHandler: (response, getState) => {
            const {singleClusterMode} = getState();

            if (!response.TenantInfo) {
                return [];
            }

            return prepareTenants(response.TenantInfo, singleClusterMode);
        },
    });
}

export const setSearchValue = (value: string) => {
    return {
        type: SET_SEARCH_VALUE,
        data: value,
    } as const;
};

export default tenants;
