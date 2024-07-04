import type {Reducer, Selector} from '@reduxjs/toolkit';
import {createSelector} from '@reduxjs/toolkit';

import {isEntityWithMergedImplementation} from '../../../containers/Tenant/utils/schema';
import type {EPathType, TEvDescribeSchemeResult} from '../../../types/api/schema';
import type {RootState} from '../../defaultStore';
import {api} from '../api';

import type {SchemaAction, SchemaState} from './types';

const SET_SHOW_PREVIEW = 'schema/SET_SHOW_PREVIEW';

export const initialState = {
    loading: true,
    data: {},
    currentSchemaPath: undefined,
    showPreview: false,
};

const schema: Reducer<SchemaState, SchemaAction> = (state = initialState, action) => {
    switch (action.type) {
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

export function setShowPreview(value: boolean) {
    return {
        type: SET_SHOW_PREVIEW,
        data: value,
    } as const;
}

export default schema;

export const schemaApi = api.injectEndpoints({
    endpoints: (builder) => ({
        createDirectory: builder.mutation<unknown, {database: string; path: string}>({
            queryFn: async ({database, path}, {signal}) => {
                try {
                    const data = await window.api.createSchemaDirectory(database, path, {signal});
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
        }),
        getSchema: builder.query<TEvDescribeSchemeResult & {partial?: boolean}, {path: string}>({
            queryFn: async ({path}, {signal}) => {
                try {
                    const data = await window.api.getSchema({path}, {signal});
                    return {data: data ?? {}};
                } catch (error) {
                    return {error};
                }
            },
            keepUnusedDataFor: Infinity,
            forceRefetch: ({endpointState}) => {
                const data = endpointState?.data;
                if (data && typeof data === 'object' && 'partial' in data && data.partial) {
                    return true;
                }
                return false;
            },
            onQueryStarted: async ({path}, {dispatch, getState, queryFulfilled}) => {
                const {data} = await queryFulfilled;
                if (data) {
                    const state = getState();
                    const {PathDescription: {Children = []} = {}} = data;
                    for (const child of Children) {
                        const {Name = ''} = child;
                        const childPath = `${path}/${Name}`;
                        const cachedData = schemaApi.endpoints.getSchema.select({path: childPath})(
                            state,
                        ).data;
                        if (!cachedData) {
                            // not full data, but it contains PathType, which ensures seamless switch between nodes
                            dispatch(
                                schemaApi.util.upsertQueryData(
                                    'getSchema',
                                    {path: childPath},
                                    {PathDescription: {Self: child}, partial: true},
                                ),
                            );
                        }
                    }
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});

const getSchemaSelector = createSelector(
    (path: string) => path,
    (path) => schemaApi.endpoints.getSchema.select({path}),
);

const selectGetSchema = createSelector(
    (state: RootState) => state,
    (_state: RootState, path: string) => getSchemaSelector(path),
    (state, selectTabletsInfo) => selectTabletsInfo(state).data,
);

const selectSchemaChildren = (state: RootState, path: string) =>
    selectGetSchema(state, path)?.PathDescription?.Children;

export const selectSchemaMergedChildrenPaths: Selector<
    RootState,
    string[] | undefined,
    [string | undefined, EPathType | undefined]
> = createSelector(
    [
        (_, path: string) => path,
        (_, _path, type: EPathType | undefined) => type,
        selectSchemaChildren,
    ],
    (path, type, children) => {
        return isEntityWithMergedImplementation(type)
            ? children?.map(({Name}) => path + '/' + Name)
            : undefined;
    },
);
