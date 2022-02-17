import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';

const FETCH_SCHEMA = createRequestActionTypes('schema', 'FETCH_SCHEMA');
const SET_SCHEMA = 'schema/SET_SCHEMA';
const ENABLE_AUTOREFRESH = 'schema/ENABLE_AUTOREFRESH';
const DISABLE_AUTOREFRESH = 'schema/DISABLE_AUTOREFRESH';

export const initialState = {
    loading: true,
    wasLoaded: false,
    data: {},
    currentSchemaPath: undefined,
    autorefresh: false,
};

const schema = function z(state = initialState, action) {
    switch (action.type) {
        case FETCH_SCHEMA.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_SCHEMA.SUCCESS: {
            const newData = JSON.parse(JSON.stringify(state.data));
            newData[action.data.Path] = action.data;
            const currentSchema = state.currentSchemaPath
                ? newData[state.currentSchemaPath]
                : action.data;
            const currentSchemaPath = state.currentSchemaPath || action.data.Path;
            return {
                ...state,
                error: undefined,
                data: newData,
                currentSchema,
                currentSchemaPath,
                loading: false,
                wasLoaded: true,
            };
        }
        case FETCH_SCHEMA.FAILURE: {
            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        case SET_SCHEMA: {
            return {
                ...state,
                currentSchemaPath: action.data,
            };
        }
        case ENABLE_AUTOREFRESH: {
            return {
                ...state,
                autorefresh: true,
            };
        }
        case DISABLE_AUTOREFRESH: {
            return {
                ...state,
                autorefresh: false,
            };
        }
        default:
            return state;
    }
};

export function getSchema({path}) {
    return createApiRequest({
        request: window.api.getSchema({path}),
        actions: FETCH_SCHEMA,
    });
}

export function setCurrentSchemaPath(currentSchemaPath) {
    return {
        type: SET_SCHEMA,
        data: currentSchemaPath,
    };
}
export function enableAutorefresh() {
    return {
        type: ENABLE_AUTOREFRESH,
    };
}
export function disableAutorefresh() {
    return {
        type: DISABLE_AUTOREFRESH,
    };
}
export default schema;
