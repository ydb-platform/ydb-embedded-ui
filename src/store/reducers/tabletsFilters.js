import {createSelector} from 'reselect';
import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';
import {AUTO_RELOAD_INTERVAL} from '../../utils/constants';

const FETCH_TABLETS_FILTERS = createRequestActionTypes('tabletsFilters', 'FETCH_TABLETS_FILTERS');

const initialState = {
    data: undefined,
    loading: true,
    wasLoaded: false,
    stateFilter: [],
    typeFilter: [],
};

const tabletsFilters = function (state = initialState, action) {
    switch (action.type) {
        case FETCH_TABLETS_FILTERS.REQUEST: {
            return {
                ...state,
                loading: true,
                requestTime: new Date().getTime(),
            };
        }
        case FETCH_TABLETS_FILTERS.SUCCESS: {
            const timeout = new Date().getTime() - state.requestTime;
            const [tabletsData, nodes] = action.data;
            return {
                ...state,
                tabletsData,
                nodes,
                loading: false,
                wasLoaded: true,
                timeoutForRequest: timeout > AUTO_RELOAD_INTERVAL ? timeout : AUTO_RELOAD_INTERVAL,
                error: undefined,
            };
        }

        // The error with large uri is handled by GenericAPI
        case FETCH_TABLETS_FILTERS.FAILURE: {
            return {
                ...state,
                error: action.error || 'Request-URI Too Large. Please reload the page',
                loading: false,
            };
        }
        case 'CLEAR_WAS_LOADING_TABLETS': {
            const {stateFilter, typeFilter} = state;
            return {
                ...initialState,
                stateFilter,
                typeFilter,
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

export const clearWasLoadingFlag = () => ({
    type: 'CLEAR_WAS_LOADING_TABLETS',
});

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

export function getTabletsInfo(data) {
    return createApiRequest({
        request: Promise.all([window.api.getTabletsInfo(data), window.api.getNodesList()]),
        actions: FETCH_TABLETS_FILTERS,
    });
}

export const getTablets = (state) => {
    const {tabletsData} = state.tabletsFilters;
    return tabletsData?.TabletStateInfo || [];
};

export const getFilteredTablets = createSelector(
    [
        getTablets,
        (state) => state.tabletsFilters.stateFilter,
        (state) => state.tabletsFilters.typeFilter,
    ],
    (tablets, stateFilter, typeFilter) => {
        let filteredTablets = tablets;

        if (typeFilter.length > 0) {
            filteredTablets = filteredTablets.filter((tblt) =>
                typeFilter.some((filter) => tblt.Type === filter),
            );
        }
        if (stateFilter.length > 0) {
            filteredTablets = filteredTablets.filter((tblt) =>
                stateFilter.some((filter) => tblt.State === filter),
            );
        }

        return filteredTablets;
    },
);

export default tabletsFilters;
