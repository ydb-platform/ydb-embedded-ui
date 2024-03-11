import type {Reducer} from '@reduxjs/toolkit';

import type {ETabletState, EType} from '../../types/api/tablet';
import type {
    ITabletsAction,
    ITabletsApiRequestParams,
    ITabletsState,
} from '../../types/store/tablets';

import {createRequestActionTypes, createApiRequest} from '../utils';

export const FETCH_TABLETS = createRequestActionTypes('tablets', 'FETCH_TABLETS');

const CLEAR_WAS_LOADING_TABLETS = 'tablets/CLEAR_WAS_LOADING_TABLETS';
const SET_STATE_FILTER = 'tablets/SET_STATE_FILTER';
const SET_TYPE_FILTER = 'tablets/SET_TYPE_FILTER';

const initialState = {
    loading: true,
    wasLoaded: false,
    stateFilter: [],
    typeFilter: [],
};

const tablets: Reducer<ITabletsState, ITabletsAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_TABLETS.REQUEST: {
            return {
                ...state,
                loading: true,
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
        case CLEAR_WAS_LOADING_TABLETS: {
            return {
                ...state,
                wasLoaded: false,
                loading: true,
            };
        }
        case SET_STATE_FILTER: {
            return {
                ...state,
                stateFilter: action.data,
            };
        }
        case SET_TYPE_FILTER: {
            return {
                ...state,
                typeFilter: action.data,
            };
        }
        default:
            return state;
    }
};

export const setStateFilter = (stateFilter: ETabletState[]) => {
    return {
        type: SET_STATE_FILTER,
        data: stateFilter,
    } as const;
};

export const setTypeFilter = (typeFilter: EType[]) => {
    return {
        type: SET_TYPE_FILTER,
        data: typeFilter,
    } as const;
};

export const clearWasLoadingFlag = () =>
    ({
        type: CLEAR_WAS_LOADING_TABLETS,
    } as const);

export function getTabletsInfo(data: ITabletsApiRequestParams) {
    return createApiRequest({
        request: window.api.getTabletsInfo(data),
        actions: FETCH_TABLETS,
    });
}

export default tablets;
