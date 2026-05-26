import type {
    OperationCancelRequestParams,
    OperationForgetRequestParams,
    OperationKind,
    OperationListRequestParams,
    TOperation,
    TOperationList,
} from '../../types/api/operations';
import {isQueryErrorResponse} from '../../utils/query';
import {
    TABLE_COMPACTION_OPERATION_PAGE_SIZE,
    createTableCompactionQuery,
} from '../../utils/tableCompaction';
import type {StartTableCompactionParams} from '../../utils/tableCompaction';

import {api} from './api';

export const DEFAULT_PAGE_SIZE = 20;

// Validate and normalize the response to ensure it has proper structure
function validateOperationListResponse(data: TOperationList): TOperationList {
    // If operations array is missing, return empty operations and stop pagination
    if (!Array.isArray(data.operations)) {
        return {
            ...data,
            operations: [],
            // Stop pagination by setting next_page_token to '0' (no more pages)
            next_page_token: '0',
        };
    }
    return data;
}

function getNextPageToken(data: TOperationList) {
    return data.next_page_token && data.next_page_token !== '0' ? data.next_page_token : undefined;
}

export const operationsApi = api.injectEndpoints({
    endpoints: (build) => ({
        getOperationList: build.infiniteQuery<
            TOperationList, // Full response type to access next_page_token
            {database: string; kind: OperationKind; page_size?: number}, // Include page_size in query arg
            string | undefined // Page param type (page token)
        >({
            infiniteQueryOptions: {
                initialPageParam: undefined,
                getNextPageParam: (lastPage) => {
                    // Return next page token if available, undefined if no more pages
                    return getNextPageToken(lastPage);
                },
            },
            queryFn: async ({queryArg, pageParam}, {signal}) => {
                try {
                    const params: OperationListRequestParams = {
                        database: queryArg.database,
                        kind: queryArg.kind,
                        page_size: queryArg.page_size ?? DEFAULT_PAGE_SIZE,
                        page_token: pageParam,
                    };
                    const data = await window.api.operation.getOperationList(params, {signal});
                    // Validate and normalize the response
                    const validatedData = validateOperationListResponse(data);
                    return {data: validatedData};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
        getCompactionList: build.query<TOperation[], {database: string}>({
            queryFn: async ({database}, {signal}) => {
                try {
                    const params: OperationListRequestParams = {
                        database,
                        kind: 'compaction',
                        page_size: TABLE_COMPACTION_OPERATION_PAGE_SIZE,
                    };
                    const data = await window.api.operation.getOperationList(params, {signal});
                    const validatedData = validateOperationListResponse(data);

                    return {
                        data: validatedData.operations ?? [],
                    };
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
        startTableCompaction: build.mutation<void, StartTableCompactionParams>({
            queryFn: async ({database, path, cascade, maxShardsInFlight}, {signal}) => {
                try {
                    const response = await window.api.viewer.sendQuery(
                        {
                            query: createTableCompactionQuery(path, {
                                cascade,
                                maxShardsInFlight,
                            }),
                            database,
                            action: 'execute-query',
                            internal_call: true,
                        },
                        {signal, withRetries: true},
                    );

                    if (isQueryErrorResponse(response)) {
                        return {error: response.error};
                    }

                    return {data: undefined};
                } catch (error) {
                    return {error};
                }
            },
            invalidatesTags: ['All'],
        }),
        cancelOperation: build.mutation({
            queryFn: async (params: OperationCancelRequestParams, {signal}) => {
                try {
                    const data = await window.api.operation.cancelOperation(params, {signal});
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
        }),
        forgetOperation: build.mutation({
            queryFn: async (params: OperationForgetRequestParams, {signal}) => {
                try {
                    const data = await window.api.operation.forgetOperation(params, {signal});
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});
