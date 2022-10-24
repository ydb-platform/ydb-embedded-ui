import '../../services/api';
import {TEvDescribeSchemeResult} from '../../types/api/schema';
import {createRequestActionTypes, createApiRequest, ApiRequestAction} from '../utils';

const FETCH_DESCRIBE = createRequestActionTypes('describe', 'FETCH_DESCRIBE');

const describe = function z(
    state = {loading: false, wasLoaded: false, data: {}},
    action: ApiRequestAction<typeof FETCH_DESCRIBE, TEvDescribeSchemeResult, unknown>,
) {
    switch (action.type) {
        case FETCH_DESCRIBE.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_DESCRIBE.SUCCESS: {
            const newData = JSON.parse(JSON.stringify(state.data));

            // In  case of successful fetch data should always has some Path, so we could cast type here
            newData[action.data.Path as string] = action.data;

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

export function getDescribe({path}: {path: string}) {
    return createApiRequest({
        request: window.api.getDescribe({path}),
        actions: FETCH_DESCRIBE,
    });
}

export default describe;
