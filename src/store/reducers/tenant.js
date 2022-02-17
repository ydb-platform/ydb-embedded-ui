import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';
import _ from 'lodash';

const FETCH_TENANT = createRequestActionTypes('tenant', 'FETCH_TENANT');

const tenantReducer = (state = {loading: false, tenant: {}}, action) => {
    switch (action.type) {
        case FETCH_TENANT.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }

        case FETCH_TENANT.SUCCESS: {
            const {tenant, tenantNodes} = action.data;

            return {
                ...state,
                tenant,
                tenantNodes,
                loading: false,
                error: undefined,
            };
        }

        case FETCH_TENANT.FAILURE: {
            return {
                ...state,
                data: action.error,
                loading: false,
            };
        }

        case 'CLEAR_TENANT': {
            return {
                ...state,
                tenant: {},
                loading: true,
            };
        }

        default:
            return state;
    }
};

export const clearTenant = () => {
    return {type: 'CLEAR_TENANT'};
};

export const getTenantInfo = ({path}) => {
    return createApiRequest({
        request: Promise.all([window.api.getTenantInfo({path}), window.api.getNodes(path)]),
        actions: FETCH_TENANT,
        dataHandler: ([tenantData, nodesData]) => {
            const tenant = tenantData.TenantInfo[0];
            const tenantNodes = _.map(nodesData?.Tenants[0]?.Nodes, (item) => {
                if (item.Host && item.Endpoints) {
                    const address = _.find(item.Endpoints, {Name: 'http-mon'})?.Address;
                    return {
                        id: item.NodeId,
                        backend: `${item.Host}${address ? address : ''}`,
                    };
                }

                return;
            }).filter(Boolean);

            return {tenant, tenantNodes};
        },
    });
};

export default tenantReducer;
