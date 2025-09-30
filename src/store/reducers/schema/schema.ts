import React from 'react';

import {createSelector, createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import type {TEvDescribeSchemeResult} from '../../../types/api/schema';
import type {RootState} from '../../defaultStore';
import {api} from '../api';

const initialState = {
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
        createDirectory: builder.mutation<
            unknown,
            {database: string; path: string; databaseFullPath: string}
        >({
            queryFn: async ({database, path, databaseFullPath}, {signal}) => {
                try {
                    const data = await window.api.scheme.createSchemaDirectory(
                        {database, path: {path, databaseFullPath}},
                        {signal},
                    );
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
        }),
        getSchema: builder.query<
            {[path: string]: TEvDescribeSchemeResult & {partial?: boolean}},
            {path: string; database: string; databaseFullPath: string}
        >({
            queryFn: async ({path, database, databaseFullPath}, {signal}) => {
                try {
                    const data = await window.api.viewer.getSchema(
                        {path: {path, databaseFullPath}, database},
                        {signal},
                    );
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

export function useGetSchemaQuery({
    path,
    database,
    databaseFullPath,
}: {
    path: string;
    database: string;
    databaseFullPath: string;
}) {
    const {currentData, isFetching, error, refetch, originalArgs} = schemaApi.useGetSchemaQuery({
        path,
        database,
        databaseFullPath,
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

const getSchemaSelector = createSelector(
    [
        (path: string) => path,
        (_path: string, database: string) => database,
        (_path: string, _database: string, databaseFullPath: string) => databaseFullPath,
    ],
    (path, database, databaseFullPath) =>
        schemaApi.endpoints.getSchema.select({path, database, databaseFullPath}),
);

export const selectSchemaObjectData = createSelector(
    (state: RootState) => state,
    (_state: RootState, path: string) => path,
    (_state: RootState, path: string, database: string, databaseFullPath: string) =>
        getSchemaSelector(path, database, databaseFullPath),
    (state, path, selectSchemaData) => {
        return selectSchemaData(state).data?.[path];
    },
);
