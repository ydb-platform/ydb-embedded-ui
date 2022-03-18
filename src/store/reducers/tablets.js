import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';

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
            return {
                ...state,
                data: action.data,
                loading: false,
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
