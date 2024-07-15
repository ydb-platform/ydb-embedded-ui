import React from 'react';

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
        getSchema: builder.query<
            {[path: string]: TEvDescribeSchemeResult & {partial?: boolean}},
            {path: string}
        >({
            queryFn: async ({path}, {signal}) => {
                try {
                    const data = await window.api.getSchema({path}, {signal});
                    return {data: data ? {[path]: data, ...getSchemaChildren(data)} : {}};
                } catch (error) {
                    return {error};
                }
            },
            keepUnusedDataFor: Infinity,
            serializeQueryArgs: ({queryArgs: {path}}) => {
                const parts = path.split('/');
                return {path: parts[0] || parts[1]};
            },
            merge: (existing, incoming, {arg: {path}}) => {
                const {[path]: data, ...children} = incoming;
                if (data) {
                    return {
                        ...children,
                        ...existing,
                        [path]: data,
                    };
                }
                return existing;
            },
        }),
    }),
    overrideExisting: 'throw',
});

function getSchemaChildren(data: TEvDescribeSchemeResult) {
    const children: {[path: string]: TEvDescribeSchemeResult & {partial?: boolean}} = {};
    const {PathDescription: {Children = []} = {}, Path: path} = data;
    for (const child of Children) {
        const {Name = ''} = child;
        const childPath = `${path}/${Name}`;
        children[childPath] = {PathDescription: {Self: child}, Path: childPath, partial: true};
    }
    return children;
}

const getSchemaSelector = createSelector(
    (path: string) => path,
    (path) => schemaApi.endpoints.getSchema.select({path}),
);

const selectGetSchema = createSelector(
    (state: RootState) => state,
    (_state: RootState, path: string) => path,
    (_state: RootState, path: string) => getSchemaSelector(path),
    (state, path, selectTabletsInfo) => selectTabletsInfo(state).data?.[path],
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

export function useGetSchemaQuery({path}: {path: string}) {
    const {currentData, isFetching, error, refetch} = schemaApi.useGetSchemaQuery({path});

    const data = currentData?.[path];
    const isLoading = isFetching && data === undefined;

    const shouldLoad = !isLoading && ((!data && !error) || data?.partial);
    React.useEffect(() => {
        if (shouldLoad) {
            refetch();
        }
    }, [refetch, path, shouldLoad]);

    return {data, isLoading, error};
}
