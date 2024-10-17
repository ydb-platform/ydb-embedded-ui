import {
    prepareSchemaData,
    prepareViewSchema,
} from '../../containers/Tenant/Schema/SchemaViewer/prepareData';
import type {SchemaData} from '../../containers/Tenant/Schema/SchemaViewer/types';
import {isViewType} from '../../containers/Tenant/utils/schema';
import type {EPathType} from '../../types/api/schema';
import {isQueryErrorResponse} from '../../utils/query';

import {api} from './api';
import {overviewApi} from './overview/overview';
import {viewSchemaApi} from './viewSchema/viewSchema';

export interface GetTableSchemaDataParams {
    path: string;
    tenantName: string;
    type: EPathType;
}

const TABLE_SCHEMA_TIMEOUT = 1000;

const getTableSchemaDataConcurrentId = 'getTableSchemaData';

export const tableSchemeDataApi = api.injectEndpoints({
    endpoints: (build) => ({
        getTableSchemaData: build.mutation<SchemaData[], GetTableSchemaDataParams>({
            queryFn: async ({path, tenantName, type}, {dispatch}) => {
                try {
                    const schemaData = await dispatch(
                        overviewApi.endpoints.getOverview.initiate({
                            paths: [path],
                            database: tenantName,
                            timeout: TABLE_SCHEMA_TIMEOUT,
                            concurrentId: getTableSchemaDataConcurrentId + 'getOverview',
                        }),
                    );

                    if (isViewType(type)) {
                        const response = await dispatch(
                            viewSchemaApi.endpoints.getViewSchema.initiate({
                                database: tenantName,
                                path,
                                timeout: TABLE_SCHEMA_TIMEOUT,
                                concurrentId: getTableSchemaDataConcurrentId + 'getViewSchema',
                            }),
                        );

                        if (isQueryErrorResponse(response)) {
                            return {error: response};
                        }

                        const result = prepareViewSchema(response.data);
                        return {data: result};
                    }

                    const result = prepareSchemaData(type, schemaData.data?.data);

                    return {data: result};
                } catch (error) {
                    return {error};
                }
            },
        }),
    }),
});

export const {useGetTableSchemaDataMutation} = tableSchemeDataApi;
