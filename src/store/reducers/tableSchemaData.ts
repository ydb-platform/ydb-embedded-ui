import {
    prepareSchemaData,
    prepareViewSchema,
} from '../../containers/Tenant/Schema/SchemaViewer/prepareData';
import type {SchemaData} from '../../containers/Tenant/Schema/SchemaViewer/types';
import {isDocumentTable} from '../../containers/Tenant/utils';
import {isRowTableType, isViewType} from '../../containers/Tenant/utils/schema';
import type {EPathType, TEvDescribeSchemeResult} from '../../types/api/schema';
import {SECOND_IN_MS} from '../../utils/constants';
import {isQueryErrorResponse} from '../../utils/query';
import type {Nullable} from '../../utils/typecheckers';
import type {RootState} from '../defaultStore';

import {api} from './api';
import {getOverviewQueryArgs, overviewApi} from './overview/overview';
import {viewSchemaApi} from './viewSchema/viewSchema';

interface GetTableSchemaDataParams {
    path: string;
    database: string;
    databaseFullPath: string;
    type: EPathType;
    useMetaProxy?: boolean;
    scopeKey?: string;
}

interface GetTableSchemaDataResult {
    schemaData: SchemaData[];
    isDocumentTable: boolean;
}

const TABLE_SCHEMA_TIMEOUT = SECOND_IN_MS * 5;

function canClassifyTable(description?: Nullable<TEvDescribeSchemeResult>) {
    return (
        isRowTableType(description?.PathDescription?.Self?.PathType) &&
        (description?.Status === undefined || description.Status === 'StatusSuccess')
    );
}

export const tableSchemaDataApi = api.injectEndpoints({
    endpoints: (build) => ({
        getTableSchemaData: build.query<GetTableSchemaDataResult, GetTableSchemaDataParams>({
            queryFn: async (
                {path, database, type, databaseFullPath, useMetaProxy},
                {dispatch, getState, signal, queryCacheKey},
            ) => {
                try {
                    if (isViewType(type)) {
                        const response = await dispatch(
                            viewSchemaApi.endpoints.getViewSchema.initiate(
                                {
                                    database,
                                    path,
                                    databaseFullPath,
                                    timeout: TABLE_SCHEMA_TIMEOUT,
                                },
                                {subscribe: false},
                            ),
                        );

                        if (isQueryErrorResponse(response)) {
                            return {error: response};
                        }

                        const result = prepareViewSchema(response.data);
                        return {data: {schemaData: result, isDocumentTable: false}};
                    }

                    const overviewArgs = getOverviewQueryArgs({
                        path,
                        database,
                        databaseFullPath,
                        useMetaProxy,
                    });
                    const getOverview = overviewApi.endpoints.getOverview;
                    const cached = getOverview.select(overviewArgs)(getState() as RootState);
                    const needsTableType = isRowTableType(type);
                    let description = cached.data;
                    if (!cached.isSuccess || (needsTableType && !canClassifyTable(description))) {
                        description = cached.isLoading
                            ? await dispatch(
                                  getOverview.initiate(overviewArgs, {subscribe: false}),
                              ).unwrap()
                            : await window.api.viewer.getDescribe(
                                  {
                                      path: {path, databaseFullPath, useMetaProxy},
                                      database,
                                      timeout: TABLE_SCHEMA_TIMEOUT,
                                  },
                                  {signal, concurrentId: queryCacheKey},
                              );
                    }

                    if (needsTableType && !canClassifyTable(description)) {
                        return {error: new Error(description?.Reason || 'Schema is not available')};
                    }

                    return {
                        data: {
                            schemaData: prepareSchemaData(type, description),
                            isDocumentTable: isDocumentTable(description?.PathDescription),
                        },
                    };
                } catch (error) {
                    return {error};
                }
            },
        }),
    }),
});
