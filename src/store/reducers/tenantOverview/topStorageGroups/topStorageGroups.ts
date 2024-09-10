import type {StorageRequestParams} from '../../../../types/api/storage';
import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../utils/constants';
import {api} from '../../api';

import {prepareTopStorageGroupsResponse} from './utils';

export const topStorageGroupsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getTopStorageGroups: builder.query({
            queryFn: async (params: StorageRequestParams, {signal}) => {
                try {
                    const data = await window.api.getStorageInfo(
                        {
                            with: 'all',
                            sort: '-Usage',
                            limit: TENANT_OVERVIEW_TABLES_LIMIT,
                            version: 'v2',
                            ...params,
                        },
                        {signal},
                    );
                    return {data: prepareTopStorageGroupsResponse(data).groups || []};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
