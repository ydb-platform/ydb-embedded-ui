import {Reducer} from 'redux';
import {createSelector, Selector} from 'reselect';

import {
    ISchemaAction,
    ISchemaData,
    ISchemaHandledResponse,
    ISchemaRootStateSlice,
    ISchemaState,
} from '../../types/store/schema';
import {EPathType} from '../../types/api/schema';
import '../../services/api';
import {isEntityWithMergedImplementation} from '../../containers/Tenant/utils/schema';

import {createRequestActionTypes, createApiRequest} from '../utils';

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

const schema: Reducer<ISchemaState, ISchemaAction> = (state = initialState, action) => {
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

export function getSchema({path}: {path: string}) {
    const request = window.api.getSchema({path});
    return createApiRequest({
        request,
        actions: FETCH_SCHEMA,
        dataHandler: (data): ISchemaHandledResponse => {
            const newData: ISchemaData = {};
            if (data.Path) {
                newData[data.Path] = data;
            }
            return {
                path: data.Path,
                currentSchema: data,
                data: newData,
            };
        },
    });
}

export function getSchemaBatched(paths: string[]) {
    const requestArray = paths.map((p) =>
        window.api.getSchema({path: p}, {concurrentId: `getSchemaBatched|${p}`}),
    );
    const request = Promise.all(requestArray);

    return createApiRequest({
        request,
        actions: FETCH_SCHEMA,
        dataHandler: (data): ISchemaHandledResponse => {
            const newData: ISchemaData = {};

            data.forEach((dataItem) => {
                if (dataItem.Path) {
                    newData[dataItem.Path] = dataItem;
                }
            });

            return {
                path: data[0].Path,
                currentSchema: data[0],
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

export const selectSchemaChildren = (state: ISchemaRootStateSlice, path?: string) =>
    path ? state.schema.data[path]?.PathDescription?.Children : undefined;

export const selectSchemaData = (state: ISchemaRootStateSlice, path?: string) =>
    path ? state.schema.data[path] : undefined;

export const selectSchemaMergedChildrenPaths: Selector<
    ISchemaRootStateSlice,
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
