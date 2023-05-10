import type {Reducer} from 'redux';

import '../../../services/api';
import {createRequestActionTypes, createApiRequest} from '../../utils';

import type {TenantsAction, TenantsState} from './types';

export const FETCH_TENANTS = createRequestActionTypes('tenants', 'FETCH_TENANTS');

const initialState = {loading: true, wasLoaded: false};

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

            if (singleClusterMode) {
                return response.TenantInfo;
            } else {
                return response.TenantInfo?.map((tenant) => {
                    const node = tenant.Nodes ? tenant.Nodes[0] : {};
                    const address =
                        node.Host && node.Endpoints
                            ? node.Endpoints.find((endpoint) => endpoint.Name === 'http-mon')
                                  ?.Address
                            : undefined;
                    const backend = node.Host ? `${node.Host}${address ? address : ''}` : undefined;
                    return {...tenant, backend};
                });
            }
        },
    });
}

export default tenants;
