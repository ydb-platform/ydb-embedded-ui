import {Reducer} from 'redux';
import {Selector, createSelector} from 'reselect';

import '../../services/api';
import {nestedPaths} from '../../containers/Tenant/utils/schema';
import {
    ISchemaRootStateSlice,
    ISchemaState,
    ISchemaData,
    ISchemaAction,
} from '../../types/store/schema';
import {createRequestActionTypes, createApiRequest} from '../utils';

export const FETCH_SCHEMA = createRequestActionTypes('schema', 'FETCH_SCHEMA');
const PRELOAD_SCHEMAS = 'schema/PRELOAD_SCHEMAS';
const SET_SCHEMA = 'schema/SET_SCHEMA';
const SET_SHOW_PREVIEW = 'schema/SET_SHOW_PREVIEW';
const ENABLE_AUTOREFRESH = 'schema/ENABLE_AUTOREFRESH';
const DISABLE_AUTOREFRESH = 'schema/DISABLE_AUTOREFRESH';
const RESET_LOADING_STATE = 'schema/RESET_LOADING_STATE';
const RESET_CURRENT_SCHEMA_NESTED_CHILDREN = 'schema/RESET_LOADING_STATE';

export const initialState = {
    loading: true,
    wasLoaded: false,
    data: {},
    currentSchemaPath: undefined,
    autorefresh: false,
    showPreview: false,
};

const schema: Reducer<ISchemaState, ISchemaAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_SCHEMA.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_SCHEMA.SUCCESS: {
            const newData = JSON.parse(JSON.stringify(state.data));

            let currentSchemaPath, currentSchema, currentSchemaNestedChildren;

            if (Array.isArray(action.data) && action.data.length > 0) {
                const isCurrent =
                    !state.currentSchemaPath || action.data[0].Path === state.currentSchemaPath;

                newData[action.data[0].Path] = action.data[0];

                currentSchema = isCurrent ? action.data[0] : state.currentSchema;
                currentSchemaPath = isCurrent ? action.data[0].Path : state.currentSchemaPath;

                currentSchemaNestedChildren = action.data.slice(1);
            } else {
                if (action.data.Path) {
                    newData[action.data.Path] = action.data;
                }

                const isCurrent =
                    !state.currentSchemaPath || action.data.Path === state.currentSchemaPath;

                currentSchema = isCurrent ? action.data : state.currentSchema;
                currentSchemaPath = isCurrent ? action.data.Path : state.currentSchemaPath;
            }

            return {
                ...state,
                error: undefined,
                data: newData,
                currentSchema,
                currentSchemaPath,
                currentSchemaNestedChildren:
                    currentSchemaNestedChildren || state.currentSchemaNestedChildren,
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
        case RESET_CURRENT_SCHEMA_NESTED_CHILDREN: {
            return {
                ...state,
                currentSchemaNestedChildren: undefined,
            };
        }
        default:
            return state;
    }
};

export function getSchema({path}: {path: string | string[]}) {
    let request;

    if (Array.isArray(path)) {
        request = path.map((p) => window.api.getSchema({path: p}));
    } else {
        request = window.api.getSchema({path});
    }

    return createApiRequest({
        request,
        actions: FETCH_SCHEMA,
    });
}

export function setCurrentSchemaPath(currentSchemaPath: string) {
    return {
        type: SET_SCHEMA,
        data: currentSchemaPath,
    } as const;
}
export function enableAutorefresh() {
    return {
        type: ENABLE_AUTOREFRESH,
    } as const;
}
export function disableAutorefresh() {
    return {
        type: DISABLE_AUTOREFRESH,
    } as const;
}
export function setShowPreview(value: boolean) {
    return {
        type: SET_SHOW_PREVIEW,
        data: value,
    } as const;
}

// only stores data for paths that are not in the store yet
// existing paths are ignored
export function preloadSchemas(data: ISchemaData) {
    return {
        type: PRELOAD_SCHEMAS,
        data,
    } as const;
}

export function resetLoadingState() {
    return {
        type: RESET_LOADING_STATE,
    } as const;
}

export function resetCurrentSchemaNestedChildren() {
    return {
        type: RESET_CURRENT_SCHEMA_NESTED_CHILDREN,
    } as const;
}

const selectSchemaChildren = (state: ISchemaRootStateSlice, path: string | undefined) =>
    path ? state.schema.data[path]?.PathDescription?.Children : undefined;

const selectSchemaPathType = (state: ISchemaRootStateSlice, path: string | undefined) =>
    path ? state.schema.data[path]?.PathDescription?.Self?.PathType : undefined;

// should be used with shallowEqual option in react-redux useSelector
export const selectSchemaChildrenPaths: Selector<
    ISchemaRootStateSlice,
    string[] | undefined,
    [string | undefined]
> = createSelector(
    [(_, path: string | undefined) => path, selectSchemaPathType, selectSchemaChildren],
    (path, pathType, children) => {
        if (!path || !pathType || !children) {
            return undefined;
        }
        const nestedChildrenTypes = nestedPaths[pathType];
        if (nestedChildrenTypes) {
            return children
                .filter((child) => child.PathType && nestedChildrenTypes.includes(child.PathType))
                .map((child) => path + '/' + child.Name);
        } else {
            return undefined;
        }
    },
);

export default schema;
