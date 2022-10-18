import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';

const FETCH_SCHEMA = createRequestActionTypes('schema', 'FETCH_SCHEMA');
const PRELOAD_SCHEMA = 'schema/PRELOAD_SCHEMA';
const SET_SCHEMA = 'schema/SET_SCHEMA';
const SET_SHOW_PREVIEW = 'schema/SET_SHOW_PREVIEW';
const ENABLE_AUTOREFRESH = 'schema/ENABLE_AUTOREFRESH';
const DISABLE_AUTOREFRESH = 'schema/DISABLE_AUTOREFRESH';

export const initialState = {
    loading: true,
    wasLoaded: false,
    data: {},
    currentSchemaPath: undefined,
    autorefresh: false,
    showPreview: false,
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
        case PRELOAD_SCHEMA: {
            if (state.data[action.path]) {
                return state;
            }

            return {
                ...state,
                data: {
                    ...state.data,
                    [action.path]: action.data,
                },
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
        case SET_SHOW_PREVIEW: {
            return {
                ...state,
                showPreview: action.data,
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
export function setShowPreview(value) {
    return {
        type: SET_SHOW_PREVIEW,
        data: value,
    };
}

// only stores the passed data if the path doesn't exist yet
export function preloadSchema(path, data) {
    return {
        type: PRELOAD_SCHEMA,
        path,
        data,
    };
}

export default schema;
