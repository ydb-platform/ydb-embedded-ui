import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';

const FETCH_HEALTHCHECK = createRequestActionTypes('cluster', 'FETCH_HEALTHCHECK');

const initialState = {loading: false, wasLoaded: false};
const healthcheckInfo = function (state = initialState, action) {
    switch (action.type) {
        case FETCH_HEALTHCHECK.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_HEALTHCHECK.SUCCESS: {
            const {data} = action;

            return {
                ...state,
                data,
                wasLoaded: true,
                loading: false,
                error: undefined,
            };
        }
        case FETCH_HEALTHCHECK.FAILURE: {
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

export function getHealthcheckInfo(database) {
    return createApiRequest({
        request: window.api.getHealthcheckInfo(database),
        actions: FETCH_HEALTHCHECK,
    });
}

export default healthcheckInfo;
