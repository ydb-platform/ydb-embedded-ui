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

export const tableSchemaDataApi = api.injectEndpoints({
    endpoints: (build) => ({
        getTableSchemaData: build.mutation<SchemaData[], GetTableSchemaDataParams>({
            queryFn: async ({path, tenantName, type}, {dispatch}) => {
                try {
                    if (isViewType(type)) {
                        const response = await dispatch(
                            viewSchemaApi.endpoints.getViewSchema.initiate({
                                database: tenantName,
                                path,
                            }),
                        );

                        if (isQueryErrorResponse(response)) {
                            return {error: response};
                        }

                        const result = prepareViewSchema(response.data);
                        return {data: result};
                    }

                    const schemaData = await dispatch(
                        overviewApi.endpoints.getOverview.initiate({
                            paths: [path],
                            database: tenantName,
                        }),
                    );
                    const result = prepareSchemaData(type, schemaData.data?.data);

                    return {data: result};
                } catch (error) {
                    return {error};
                }
            },
        }),
    }),
});
