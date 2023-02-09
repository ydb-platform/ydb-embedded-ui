import type {Reducer} from 'redux';

import type {ITopicAction, ITopicState} from '../../types/store/topic';
import '../../services/api';

import {createRequestActionTypes, createApiRequest} from '../utils';

export const FETCH_TOPIC = createRequestActionTypes('topic', 'FETCH_TOPIC');

const SET_DATA_WAS_NOT_LOADED = 'topic/SET_DATA_WAS_NOT_LOADED';

const initialState = {
    loading: true,
    wasLoaded: false,
    data: undefined,
};

const topic: Reducer<ITopicState, ITopicAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_TOPIC.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_TOPIC.SUCCESS: {
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
        case FETCH_TOPIC.FAILURE: {
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
        default:
            return state;
    }
};

export const setDataWasNotLoaded = () => {
    return {
        type: SET_DATA_WAS_NOT_LOADED,
    } as const;
};

export function getTopic(path?: string) {
    return createApiRequest({
        request: window.api.getTopic({path}),
        actions: FETCH_TOPIC,
    });
}

export default topic;
