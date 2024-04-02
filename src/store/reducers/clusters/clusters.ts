import type {Reducer} from '@reduxjs/toolkit';

import {createApiRequest, createRequestActionTypes} from '../../utils';

import type {ClustersAction, ClustersFilters, ClustersState} from './types';
import {prepareClustersData} from './utils';

export const FETCH_CLUSTERS = createRequestActionTypes('clusters', 'FETCH_CLUSTERS');
const CHANGE_FILTERS = 'clusters/CHANGE_FILTER';

const initialState: ClustersState = {
    loading: false,
    list: [],
    clusterName: '',
    status: [],
    service: [],
    version: [],
};

const clusters: Reducer<ClustersState, ClustersAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_CLUSTERS.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_CLUSTERS.SUCCESS: {
            const {data = []} = action;

            return {
                ...state,
                loading: false,
                list: data,
                error: undefined,
            };
        }
        case FETCH_CLUSTERS.FAILURE: {
            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        case CHANGE_FILTERS: {
            return {
                ...state,
                ...action.data,
            };
        }
        default:
            return state;
    }
};

export function fetchClustersList() {
    return createApiRequest({
        request: window.api.getClustersList(),
        actions: FETCH_CLUSTERS,
        dataHandler: prepareClustersData,
    });
}

export function changeClustersFilters(filters: Partial<ClustersFilters>) {
    return {
        type: CHANGE_FILTERS,
        data: filters,
    } as const;
}

export default clusters;
