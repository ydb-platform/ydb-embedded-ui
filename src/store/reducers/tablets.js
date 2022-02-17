import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';
import {AUTO_RELOAD_INTERVAL} from '../../utils/constants';

const FETCH_TABLETS = createRequestActionTypes('tablets', 'FETCH_TABLETS');

const initialState = {
    loading: true,
    wasLoaded: false,
    stateFilter: [],
    typeFilter: [],
};

const tablets = function z(state = initialState, action) {
    switch (action.type) {
        case FETCH_TABLETS.REQUEST: {
            return {
                ...state,
                loading: true,
                requestTime: new Date().getTime(),
            };
        }
        case FETCH_TABLETS.SUCCESS: {
            const timeout = new Date().getTime() - state.requestTime;
            return {
                ...state,
                data: action.data,
                loading: false,
                timeoutForRequest: timeout > AUTO_RELOAD_INTERVAL ? timeout : AUTO_RELOAD_INTERVAL,
                error: undefined,
                wasLoaded: true,
            };
        }
        case FETCH_TABLETS.FAILURE: {
            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        case 'CLEAR_WAS_LOADING_TABLETS': {
            return {
                ...state,
                wasLoaded: false,
                loading: true,
            };
        }
        case 'SET_STATE_FILTER': {
            return {
                ...state,
                stateFilter: action.data,
            };
        }
        case 'SET_TYPE_FILTER': {
            return {
                ...state,
                typeFilter: action.data,
            };
        }
        default:
            return state;
    }
};

export const setStateFilter = (stateFilter) => {
    return {
        type: 'SET_STATE_FILTER',
        data: stateFilter,
    };
};

export const setTypeFilter = (typeFilter) => {
    return {
        type: 'SET_TYPE_FILTER',
        data: typeFilter,
    };
};

export const clearWasLoadingFlag = () => ({
    type: 'CLEAR_WAS_LOADING_TABLETS',
});

export function getTabletsInfo(data) {
    return createApiRequest({
        request: window.api.getTabletsInfo(data),
        actions: FETCH_TABLETS,
    });
}

export default tablets;
