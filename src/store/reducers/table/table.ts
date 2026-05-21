import type {SchemaPathParam} from '../../../types/api/common';
import {isQueryErrorResponse, parseQueryAPIResponse} from '../../../utils/query';
import {api} from '../api';

import type {BuildTemplateOptions, FormValues} from './types';
import {
    buildCreateColumnTableQuery,
    buildCreateTableQuery,
    buildUpdateTableQuery,
    prepareFormValues,
    prepareYdbCreateQueryColumns,
} from './utils';

export const tableApi = api.injectEndpoints({
    endpoints: (build) => ({
        getTable: build.query({
            queryFn: async ({database, path}: {database: string; path: SchemaPathParam}) => {
                try {
                    const response = await window.api.viewer.getDescribe({
                        path,
                        database,
                    });

                    if (!response) {
                        return {error: {message: 'Table not found'}};
                    }

                    return {data: prepareFormValues(response)};
                } catch (error) {
                    return {error};
                }
            },
        }),
        createTable: build.mutation({
            queryFn: async ({database, formValues}: {database: string; formValues: FormValues}) => {
                try {
                    const {type, name, columns, settings, secondaryIndexes, partitionKey} =
                        formValues;

                    const options: BuildTemplateOptions = {
                        tableName: name,
                        columns: prepareYdbCreateQueryColumns(columns),
                        settings: settings,
                        ...(type === 'row' && {secondaryIndexes}),
                        ...(type === 'column' && {columnsHash: partitionKey}),
                    };

                    const query =
                        type === 'row'
                            ? buildCreateTableQuery(options)
                            : buildCreateColumnTableQuery(options);

                    const response = await window.api.viewer.sendQuery({
                        query,
                        database,
                        action: 'execute-query',
                    });

                    if (isQueryErrorResponse(response)) {
                        return {error: response};
                    }

                    const data = parseQueryAPIResponse(response);
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            invalidatesTags: (_result, error) => (error ? [] : ['All']),
        }),
        updateTable: build.mutation({
            queryFn: async ({database, formValues}: {database: string; formValues: FormValues}) => {
                try {
                    const {name, columns, settings, secondaryIndexes, deletedColumns} = formValues;

                    const options: BuildTemplateOptions = {
                        tableName: name,
                        columns,
                        secondaryIndexes,
                        deletedColumns,
                        settings,
                    };

                    const query = buildUpdateTableQuery(options);

                    const response = await window.api.viewer.sendQuery({
                        query,
                        database,
                        action: 'execute-query',
                    });

                    if (isQueryErrorResponse(response)) {
                        return {error: response};
                    }

                    const data = parseQueryAPIResponse(response);
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            invalidatesTags: (_result, error) => (error ? [] : ['All']),
        }),
    }),
    overrideExisting: 'throw',
});
