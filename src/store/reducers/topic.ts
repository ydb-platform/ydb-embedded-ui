import type {Reducer} from 'redux';

import type {ITopicAction, ITopicState} from '../../types/store/topic';
import '../../services/api';

import {createRequestActionTypes, createApiRequest} from '../utils';

export const FETCH_TOPIC = createRequestActionTypes('topic', 'FETCH_TOPIC');

const initialState = {
    loading: true,
    wasLoaded: false,
    data: {},
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
            return {
                ...state,
                data: action.data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_TOPIC.FAILURE: {
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

export function getTopic(path?: string) {
    return createApiRequest({
        request: window.api.getTopic({path}),
        actions: FETCH_TOPIC,
    });
}

export default topic;
