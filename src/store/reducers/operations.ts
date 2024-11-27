import type {
    OperationCancelRequestParams,
    OperationForgetRequestParams,
    OperationListRequestParams,
} from '../../types/api/operations';

import {api} from './api';

export const operationsApi = api.injectEndpoints({
    endpoints: (build) => ({
        getOperationList: build.query({
            queryFn: async (params: OperationListRequestParams, {signal}) => {
                try {
                    const data = await window.api.operation.getOperationList(params, {signal});
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
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
