import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';

const FETCH_GROUP = createRequestActionTypes('GROUP', 'FETCH_GROUP');

const initialState = {loading: true, wasLoaded: false, data: undefined};

const group = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_GROUP.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_GROUP.SUCCESS: {
            return {
                ...state,
                data: action.data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_GROUP.FAILURE: {
            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        case 'CLEAR_STORE': {
            return initialState;
        }
        default:
            return state;
    }
};

export const clearStore = () => ({type: 'CLEAR_STORE'});

export const getGroupInfo = (nodeId) => {
    return createApiRequest({
        request: window.api.getGroupInfo(nodeId),
        actions: FETCH_GROUP,
    });
};

export default group;
