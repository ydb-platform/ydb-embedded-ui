import type {Reducer} from 'redux';

import type {OverviewState, OverviewAction, OverviewHandledResponse} from './types';

import {createRequestActionTypes, createApiRequest} from '../../utils';

export const FETCH_OVERVIEW = createRequestActionTypes('overview', 'FETCH_OVERVIEW');
const SET_CURRENT_OVERVIEW_PATH = 'overview/SET_CURRENT_OVERVIEW_PATH';
const SET_DATA_WAS_NOT_LOADED = 'overview/SET_DATA_WAS_NOT_LOADED';

export const initialState = {
    loading: true,
    wasLoaded: false,
};

const schema: Reducer<OverviewState, OverviewAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_OVERVIEW.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_OVERVIEW.SUCCESS: {
            if (action.data.data.Path !== state.currentOverviewPath) {
                return state;
            }

            return {
                ...state,
                error: undefined,
                data: action.data.data,
                additionalData: action.data.additionalData,
                loading: false,
                wasLoaded: true,
            };
        }
        case FETCH_OVERVIEW.FAILURE: {
            if (action.error?.isCancelled) {
                return state;
            }

            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        case SET_CURRENT_OVERVIEW_PATH: {
            return {
                ...state,
                currentOverviewPath: action.data,
            };
        }
        case SET_DATA_WAS_NOT_LOADED: {
            return {
                ...state,
                wasLoaded: false,
            };
        }
        default:
            return state;
    }
};

export function getOverview({path}: {path: string}) {
    const request = window.api.getDescribe({path}, {concurrentId: 'getOverview'});
    return createApiRequest({
        request,
        actions: FETCH_OVERVIEW,
        dataHandler: (data): OverviewHandledResponse => {
            return {data};
        },
    });
}

export function getOverviewBatched(paths: string[]) {
    const requestArray = paths.map((p) =>
        window.api.getDescribe({path: p}, {concurrentId: `getOverviewBatched|${p}`}),
    );
    const request = Promise.all(requestArray);

    return createApiRequest({
        request,
        actions: FETCH_OVERVIEW,
        dataHandler: ([item, ...rest]): OverviewHandledResponse => {
            return {
                data: item,
                additionalData: rest,
            };
        },
    });
}

export function setDataWasNotLoaded() {
    return {
        type: SET_DATA_WAS_NOT_LOADED,
    } as const;
}

export const setCurrentOverviewPath = (path?: string) => {
    return {
        type: SET_CURRENT_OVERVIEW_PATH,
        data: path,
    } as const;
};

export default schema;
