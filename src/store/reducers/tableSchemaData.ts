import {
    prepareSchemaData,
    prepareViewSchema,
} from '../../containers/Tenant/Schema/SchemaViewer/prepareData';
import type {SchemaData} from '../../containers/Tenant/Schema/SchemaViewer/types';
import {isViewType} from '../../containers/Tenant/utils/schema';
import type {EPathType} from '../../types/api/schema';
import {isQueryErrorResponse} from '../../utils/query';

import {api} from './api';
import {createViewSchemaQuery} from './viewSchema/viewSchema';

export interface GetTableSchemaDataParams {
    path: string;
    tenantName: string;
    type: EPathType;
}

const tableSchemaDataConcurrentId = 'getTableSchemaData';

const TABLE_SCHEMA_TIMEOUT = 1000;

export const tableSchemeDataApi = api.injectEndpoints({
    endpoints: (build) => ({
        getTableSchemaData: build.mutation<SchemaData[], GetTableSchemaDataParams>({
            queryFn: async ({path, tenantName, type}, {signal}) => {
                try {
                    const schemaData = await window.api.getDescribe(
                        {
                            path,
                            database: tenantName,
                            timeout: TABLE_SCHEMA_TIMEOUT,
                        },
                        {signal, concurrentId: tableSchemaDataConcurrentId + 'describe'},
                    );

                    if (isViewType(type)) {
                        const response = await window.api.sendQuery(
                            {
                                query: createViewSchemaQuery(path),
                                database: tenantName,
                                action: 'execute-scan',
                                timeout: TABLE_SCHEMA_TIMEOUT,
                            },
                            {
                                withRetries: true,
                                concurrentId: tableSchemaDataConcurrentId + 'query',
                            },
                        );

                        if (isQueryErrorResponse(response)) {
                            return {error: response};
                        }

                        const viewColumnsData = {data: response?.result?.[0]?.columns || []};
                        const result = prepareViewSchema(viewColumnsData.data);
                        return {data: result};
                    }

                    const result = prepareSchemaData(type, schemaData);

                    return {data: result};
                } catch (error) {
                    return {error};
                }
            },
        }),
    }),
});

export const {useGetTableSchemaDataMutation} = tableSchemeDataApi;
