import type {Reducer} from 'redux';

import type {IConsumerAction, IConsumerState} from '../../types/store/consumer';

import '../../services/api';

import {createRequestActionTypes, createApiRequest} from '../utils';

export const FETCH_CONSUMER = createRequestActionTypes('consumer', 'FETCH_CONSUMER');

const SET_DATA_WAS_NOT_LOADED = 'consumer/SET_DATA_WAS_NOT_LOADED';
const SET_SELECTED_CONSUMER = 'consumer/SET_SELECTED_CONSUMER';

const initialState = {
    loading: false,
    wasLoaded: false,
    data: {},
};

const consumer: Reducer<IConsumerState, IConsumerAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_CONSUMER.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_CONSUMER.SUCCESS: {
            // On older version it can return HTML page of Internal Viewer with an error
            if (typeof action.data !== 'object') {
                return {...state, loading: false, error: {}};
            }

            return {
                ...state,
                data: action.data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_CONSUMER.FAILURE: {
            if (action.error?.isCancelled) {
                return state;
            }

            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        case SET_DATA_WAS_NOT_LOADED: {
            return {
                ...state,
                wasLoaded: false,
            };
        }
        case SET_SELECTED_CONSUMER: {
            return {
                ...state,
                selectedConsumer: action.data,
            };
        }
        default:
            return state;
    }
};

export const setDataWasNotLoaded = () => {
    return {
        type: SET_DATA_WAS_NOT_LOADED,
    } as const;
};

export const setSelectedConsumer = (value?: string) => {
    return {
        type: SET_SELECTED_CONSUMER,
        data: value,
    } as const;
};

export function getConsumer(path?: string, consumerName?: string) {
    return createApiRequest({
        request: window.api.getConsumer({path, consumer: consumerName}),
        actions: FETCH_CONSUMER,
    });
}

export default consumer;
