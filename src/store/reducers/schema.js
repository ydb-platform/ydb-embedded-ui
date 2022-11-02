import {createSelector} from 'reselect';

import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';
import {nestedPaths} from '../../containers/Tenant/utils/schema';

const FETCH_SCHEMA = createRequestActionTypes('schema', 'FETCH_SCHEMA');
const PRELOAD_SCHEMAS = 'schema/PRELOAD_SCHEMAS';
const SET_SCHEMA = 'schema/SET_SCHEMA';
const SET_SHOW_PREVIEW = 'schema/SET_SHOW_PREVIEW';
const ENABLE_AUTOREFRESH = 'schema/ENABLE_AUTOREFRESH';
const DISABLE_AUTOREFRESH = 'schema/DISABLE_AUTOREFRESH';
const RESET_LOADING_STATE = 'schema/RESET_LOADING_STATE';

export const initialState = {
    loading: true,
    wasLoaded: false,
    data: {},
    currentSchemaPath: undefined,
    autorefresh: false,
    showPreview: false,
};

const schema = (state = initialState, action) => {
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
            if (action.error?.isCancelled) {
                return state;
            }

            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        case PRELOAD_SCHEMAS: {
            return {
                ...state,
                data: {
                    // we don't want to overwrite existing paths
                    ...action.data,
                    ...state.data,
                },
            };
        }
        case SET_SCHEMA: {
            return {
                ...state,
                currentSchemaPath: action.data,
                wasLoaded: false,
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
        case RESET_LOADING_STATE: {
            return {
                ...state,
                wasLoaded: initialState.wasLoaded,
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

// only stores data for paths that are not in the store yet
// existing paths are ignored
export function preloadSchemas(data) {
    return {
        type: PRELOAD_SCHEMAS,
        data,
    };
}

export function resetLoadingState() {
    return {
        type: RESET_LOADING_STATE,
    };
}

const selectSchemaChildren = (state, path) => {
    return state.schema.data[path]?.PathDescription?.Children;
};

const selectSchemaPathType = (state, path) =>
    state.schema.data[path]?.PathDescription?.Self?.PathType;

export const selectSchemaChildrenPaths = createSelector(
    [
        (_, path) => path,
        (state, path) => selectSchemaPathType(state, path),
        (state, path) => selectSchemaChildren(state, path),
    ],
    (path, pathType, children) => {
        const nestedChildrenTypes = nestedPaths[pathType];
        if (nestedChildrenTypes && children) {
            return children
                .filter((child) => nestedChildrenTypes.includes(child.PathType))
                .map((child) => path + '/' + child.Name);
        } else {
            return undefined;
        }
    },
);

export default schema;
