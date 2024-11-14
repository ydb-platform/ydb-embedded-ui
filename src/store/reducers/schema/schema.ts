import React from 'react';

import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import type {TEvDescribeSchemeResult} from '../../../types/api/schema';
import {api} from '../api';

export const initialState = {
    loading: true,
    data: {},
    currentSchemaPath: undefined,
    showPreview: false,
};

const slice = createSlice({
    name: 'schema',
    initialState,
    reducers: {
        setShowPreview: (state, action: PayloadAction<boolean>) => {
            state.showPreview = action.payload;
        },
    },
    selectors: {
        selectShowPreview: (state) => state.showPreview,
    },
});

export default slice.reducer;
export const {setShowPreview} = slice.actions;
export const {selectShowPreview} = slice.selectors;

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
