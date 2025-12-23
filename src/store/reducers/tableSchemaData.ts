import {
    prepareSchemaData,
    prepareViewSchema,
} from '../../containers/Tenant/Schema/SchemaViewer/prepareData';
import type {SchemaData} from '../../containers/Tenant/Schema/SchemaViewer/types';
import {isViewType} from '../../containers/Tenant/utils/schema';
import type {EPathType} from '../../types/api/schema';
import {SECOND_IN_MS} from '../../utils/constants';
import {isQueryErrorResponse} from '../../utils/query';

import {api} from './api';
import {overviewApi} from './overview/overview';
import {viewSchemaApi} from './viewSchema/viewSchema';

interface GetTableSchemaDataParams {
    path: string;
    database: string;
    databaseFullPath: string;
    type: EPathType;
    useMetaProxy?: boolean;
}

const TABLE_SCHEMA_TIMEOUT = SECOND_IN_MS * 5;

export const tableSchemaDataApi = api.injectEndpoints({
    endpoints: (build) => ({
        getTableSchemaData: build.query<SchemaData[], GetTableSchemaDataParams>({
            queryFn: async ({path, database, type, databaseFullPath, useMetaProxy}, {dispatch}) => {
                try {
                    if (isViewType(type)) {
                        const response = await dispatch(
                            viewSchemaApi.endpoints.getViewSchema.initiate({
                                database,
                                path,
                                databaseFullPath,
                                timeout: TABLE_SCHEMA_TIMEOUT,
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
                            path,
                            database,
                            timeout: TABLE_SCHEMA_TIMEOUT,
                            databaseFullPath,
                            useMetaProxy,
                        }),
                    );
                    const result = prepareSchemaData(type, schemaData.data);

                    return {data: result};
                } catch (error) {
                    return {error};
                }
            },
        }),
    }),
});
