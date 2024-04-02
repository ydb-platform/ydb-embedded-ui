import type {Reducer, Selector} from '@reduxjs/toolkit';
import {createSelector} from '@reduxjs/toolkit';

import {isEntityWithMergedImplementation} from '../../../containers/Tenant/utils/schema';
import type {EPathType} from '../../../types/api/schema';
import {createApiRequest, createRequestActionTypes} from '../../utils';

import type {
    SchemaAction,
    SchemaData,
    SchemaHandledResponse,
    SchemaState,
    SchemaStateSlice,
} from './types';

export const FETCH_SCHEMA = createRequestActionTypes('schema', 'FETCH_SCHEMA');
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

const schema: Reducer<SchemaState, SchemaAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_SCHEMA.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_SCHEMA.SUCCESS: {
            const isCurrentSchema =
                !state.currentSchemaPath || state.currentSchemaPath === action.data.path;

            const newData = {...state.data, ...action.data.data};

            if (!isCurrentSchema) {
                return {
                    ...state,
                    data: newData,
                };
            }

            return {
                ...state,
                error: undefined,
                data: newData,
                currentSchema: action.data.currentSchema,
                currentSchemaPath: action.data.path,
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

export function getSchema({path}: {path: string}) {
    const request = window.api.getSchema({path});
    return createApiRequest({
        request,
        actions: FETCH_SCHEMA,
        dataHandler: (data): SchemaHandledResponse => {
            const newData: SchemaData = {};
            if (data?.Path) {
                newData[data.Path] = data;
            }
            return {
                path: data?.Path,
                currentSchema: data ?? undefined,
                data: newData,
            };
        },
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
export function preloadSchemas(data: SchemaData) {
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

const selectSchemaChildren = (state: SchemaStateSlice, path?: string) =>
    path ? state.schema.data[path]?.PathDescription?.Children : undefined;

export const selectSchemaData = (state: SchemaStateSlice, path?: string) =>
    path ? state.schema.data[path] : undefined;

export const selectSchemaMergedChildrenPaths: Selector<
    SchemaStateSlice,
    string[] | undefined,
    [string | undefined, EPathType | undefined]
> = createSelector(
    [
        (_, path?: string) => path,
        (_, _path, type: EPathType | undefined) => type,
        selectSchemaChildren,
    ],
    (path, type, children) => {
        return isEntityWithMergedImplementation(type)
            ? children?.map(({Name}) => path + '/' + Name)
            : undefined;
    },
);

export default schema;
