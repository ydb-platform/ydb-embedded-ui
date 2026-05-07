import {isQueryErrorResponse, parseQueryAPIResponse} from '../../../utils/query';
import {api} from '../api';

import type {BuildTemplateOptions, ColumnField, SecondaryIndex, TableSettings} from './types';
import {
    buildCreateColumnTableQuery,
    buildCreateTableQuery,
    prepareYdbCreateQueryColumns,
} from './utils';

export const createTableApi = api.injectEndpoints({
    endpoints: (build) => ({
        createTable: build.mutation({
            queryFn: async ({
                database,
                type,
                name,
                columns,
                secondaryIndexes,
                partitionKey,
                settings,
            }: {
                database: string;
                type: 'row' | 'column';
                name: string;
                columns: ColumnField[];
                settings: TableSettings;
                secondaryIndexes?: SecondaryIndex[];
                partitionKey?: string[];
            }) => {
                try {
                    const options: BuildTemplateOptions = {
                        tableName: name,
                        columns: prepareYdbCreateQueryColumns(columns),
                        settings,
                        ...(type === 'row' ? {secondaryIndexes} : {columnsHash: partitionKey}),
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
    }),
    overrideExisting: 'throw',
});
