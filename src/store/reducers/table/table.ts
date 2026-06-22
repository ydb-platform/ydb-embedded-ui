import type {SchemaPathParam} from '../../../types/api/common';
import type {TEvDescribeSchemeResult} from '../../../types/api/schema/schema';
import {isQueryErrorResponse, parseQueryAPIResponse} from '../../../utils/query';
import {api} from '../api';

import type {BuildTemplateOptions, TableFormValues} from './types';
import {
    buildCreateColumnTableQuery,
    buildCreateTableQuery,
    buildUpdateTableQuery,
    getTablePathInfoForUpdate,
    hasUpdateTableSettings,
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

                    return {data: response};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
        createTable: build.mutation({
            queryFn: async ({
                database,
                formValues,
            }: {
                database: string;
                formValues: TableFormValues;
            }) => {
                try {
                    const {
                        type,
                        name,
                        columns,
                        settings,
                        secondaryIndexes,
                        partitionKey,
                        partitionCount,
                    } = formValues;

                    const options: BuildTemplateOptions = {
                        tableName: name,
                        columns: prepareYdbCreateQueryColumns(columns),
                        ...(type === 'row' && {secondaryIndexes}),
                        ...(type === 'column' && {columnsHash: partitionKey}),
                        settings:
                            type === 'column'
                                ? {
                                      ttl: settings.ttl,
                                      autoPartitionMinPartitions: partitionCount,
                                  }
                                : settings,
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
            queryFn: async ({
                database,
                formValues,
                originalTable,
                updateSettings,
            }: {
                database: string;
                formValues: TableFormValues;
                originalTable: TEvDescribeSchemeResult;
                updateSettings?: BuildTemplateOptions['settings'];
            }) => {
                try {
                    const {name, columns, deletedColumns} = formValues;

                    const pathDesc = originalTable.PathDescription;
                    const {originalName, tablePath, updatedTablePath} = getTablePathInfoForUpdate(
                        originalTable,
                        name,
                    );
                    const originalHadTtl = Boolean(
                        pathDesc?.Table?.TTLSettings?.Enabled ??
                            pathDesc?.ColumnTableDescription?.TtlSettings?.Enabled,
                    );
                    const shouldResetTtl =
                        updateSettings?.ttl?.status === 'disabled' && originalHadTtl;
                    const shouldRename = Boolean(originalName && name !== originalName);

                    const updateOptions: BuildTemplateOptions = {
                        tableName: tablePath,
                        columns,
                        deletedColumns,
                        settings: updateSettings,
                        resetItems: shouldResetTtl ? ['TTL'] : undefined,
                        renameTo: shouldRename ? updatedTablePath : undefined,
                    };

                    const hasUpdateActions =
                        deletedColumns.length > 0 ||
                        columns.length > 0 ||
                        hasUpdateTableSettings(updateSettings);

                    if (!shouldResetTtl && !hasUpdateActions && !shouldRename) {
                        return {data: undefined};
                    }

                    const response = await window.api.viewer.sendQuery({
                        query: buildUpdateTableQuery(updateOptions),
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
