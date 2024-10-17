import React from 'react';

import type {Reducer} from '@reduxjs/toolkit';

import type {TEvDescribeSchemeResult} from '../../../types/api/schema';
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
                    const data = await window.api.createSchemaDirectory({database, path}, {signal});
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
        }),
        getSchema: builder.query<
            {[path: string]: TEvDescribeSchemeResult & {partial?: boolean}},
            {path: string; database: string}
        >({
            queryFn: async ({path, database}, {signal}) => {
                try {
                    const data = await window.api.getSchema({path, database}, {signal});
                    if (!data) {
                        return {error: new Error('Schema is not available')};
                    }
                    return {data: {[path]: data, ...getSchemaChildren(data)}};
                } catch (error) {
                    return {error};
                }
            },
            keepUnusedDataFor: Infinity,
            serializeQueryArgs: ({queryArgs: {database}}) => {
                return {database};
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

export function useGetSchemaQuery({path, database}: {path: string; database: string}) {
    const {currentData, isFetching, error, refetch, originalArgs} = schemaApi.useGetSchemaQuery({
        path,
        database,
    });

    const data = currentData?.[path];
    const isLoading = isFetching && data === undefined;
    const currentPathError = originalArgs?.path === path ? error : undefined;

    const shouldLoad = !isLoading && ((!data && !error) || data?.partial);
    React.useEffect(() => {
        if (shouldLoad) {
            refetch();
        }
    }, [refetch, path, shouldLoad]);

    return {data, isLoading, error: currentPathError};
}
