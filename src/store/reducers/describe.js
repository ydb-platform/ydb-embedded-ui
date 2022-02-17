import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';

const FETCH_DESCRIBE = createRequestActionTypes('describe', 'FETCH_DESCRIBE');

const describe = function z(state = {loading: false, wasLoaded: false, data: {}}, action) {
    switch (action.type) {
        case FETCH_DESCRIBE.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_DESCRIBE.SUCCESS: {
            const newData = JSON.parse(JSON.stringify(state.data));
            newData[action.data.Path] = action.data;
            return {
                ...state,
                data: newData,
                currentDescribe: action.data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_DESCRIBE.FAILURE: {
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

export function getDescribe({path}) {
    return createApiRequest({
        request: window.api.getDescribe({path}),
        actions: FETCH_DESCRIBE,
    });
}

export default describe;
