import type {OperationListRequestParams} from '../../types/api/operationList';

import {api} from './api';

export const operationListApi = api.injectEndpoints({
    endpoints: (build) => ({
        getOperationList: build.query({
            queryFn: async (params: OperationListRequestParams, {signal}) => {
                try {
                    const data = await window.api.getOperationList(params, {signal});
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
